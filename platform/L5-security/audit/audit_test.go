package audit

import (
	"errors"
	"testing"
)

func seed(t *testing.T) *Log {
	t.Helper()
	l := New()
	entries := []Entry{
		{TS: "2026-06-19T10:00:00Z", Actor: "deo:chennai", Action: "fund.release", Resource: "scheme:NMMS", Effect: "require-approval", Detail: "PFMS-SANCTION"},
		{TS: "2026-06-19T10:01:00Z", Actor: "auditor:cag", Action: "audit.read", Resource: "fund:NMMS", Effect: "permit"},
		{TS: "2026-06-19T10:02:00Z", Actor: "head:school-7", Action: "student.expel", Resource: "student:42", Effect: "deny", Detail: "RTE-NO-DETENTION"},
	}
	for _, e := range entries {
		if _, err := l.Append(e); err != nil {
			t.Fatal(err)
		}
	}
	return l
}

func TestAppendChainsAndVerifies(t *testing.T) {
	l := seed(t)
	if l.Len() != 3 {
		t.Fatalf("expected 3 records, got %d", l.Len())
	}
	recs := l.Records()
	if recs[0].PrevHash != genesisPrev {
		t.Fatal("first record must chain to genesis")
	}
	if recs[1].PrevHash != recs[0].Hash || recs[2].PrevHash != recs[1].Hash {
		t.Fatal("records must chain to their predecessor's hash")
	}
	if bad, err := l.Verify(); err != nil {
		t.Fatalf("clean chain must verify; bad=%d err=%v", bad, err)
	}
}

func TestTamperedContentDetected(t *testing.T) {
	recs := seed(t).Records()
	// flip a denied decision to permit without recomputing the hash (a malicious edit)
	recs[2].Effect = "permit"
	bad, err := Verify(recs)
	if err == nil {
		t.Fatal("a content edit must be detected")
	}
	if bad != 2 {
		t.Fatalf("expected break at index 2, got %d", bad)
	}
}

func TestDeletionDetected(t *testing.T) {
	recs := seed(t).Records()
	// delete the middle record and renumber-less: chain link + seq both break
	tampered := []Record{recs[0], recs[2]}
	if _, err := Verify(tampered); err == nil {
		t.Fatal("deleting a record must break the chain")
	}
}

func TestTruncationDetected(t *testing.T) {
	l := seed(t)
	head := l.Head()
	recs := l.Records()[:2] // drop the tail
	if _, err := Verify(recs); err != nil {
		t.Fatal("a prefix is itself a valid chain (expected)")
	}
	// but the head no longer matches — truncation is caught by comparing to the anchored head
	if recs[len(recs)-1].Hash == head {
		t.Fatal("truncated head should differ from the real head")
	}
}

func TestReorderDetected(t *testing.T) {
	recs := seed(t).Records()
	recs[1], recs[2] = recs[2], recs[1]
	if _, err := Verify(recs); err == nil {
		t.Fatal("reordering records must be detected")
	}
}

func TestMerkleRootStableAndSensitive(t *testing.T) {
	a := seed(t).MerkleRoot()
	b := seed(t).MerkleRoot()
	if a != b {
		t.Fatal("Merkle root must be deterministic for identical history")
	}
	l := seed(t)
	l.Append(Entry{TS: "2026-06-19T10:03:00Z", Actor: "x", Action: "extra"})
	if l.MerkleRoot() == a {
		t.Fatal("appending a record must change the Merkle root")
	}
}

func TestEmptyAppendRejected(t *testing.T) {
	if _, err := New().Append(Entry{Actor: "x"}); err == nil {
		t.Fatal("an entry with no action must be rejected")
	}
}

func TestEmptyLogRoots(t *testing.T) {
	l := New()
	if l.Head() != genesisPrev || l.MerkleRoot() != genesisPrev {
		t.Fatal("empty log head/root should be genesis")
	}
}

// fakeSink is an in-test durability backend for the audit log.
type fakeSink struct {
	stored []Record
	failOn int // persist returns an error when len(stored)==failOn (0 = never)
}

func (f *fakeSink) Persist(r Record) error {
	if f.failOn != 0 && len(f.stored) == f.failOn {
		return errors.New("disk full")
	}
	f.stored = append(f.stored, r)
	return nil
}
func (f *fakeSink) Load() ([]Record, error) { return f.stored, nil }

func TestSinkPersistsAndReloads(t *testing.T) {
	sink := &fakeSink{}
	l, err := NewWithSink(sink)
	if err != nil {
		t.Fatal(err)
	}
	for i := 0; i < 3; i++ {
		if _, err := l.Append(Entry{Action: "fund.release", Actor: "SEC", TS: "t"}); err != nil {
			t.Fatal(err)
		}
	}
	if len(sink.stored) != 3 {
		t.Fatalf("sink must have 3 persisted records, got %d", len(sink.stored))
	}
	// a NEW log over the same sink reloads the verified chain and continues from its head.
	l2, err := NewWithSink(sink)
	if err != nil {
		t.Fatalf("reload: %v", err)
	}
	if l2.Len() != 3 {
		t.Fatalf("reloaded log must have 3 records, got %d", l2.Len())
	}
	r, _ := l2.Append(Entry{Action: "offswitch.engage", TS: "t"})
	if r.Seq != 4 || r.PrevHash != sink.stored[2].Hash {
		t.Fatalf("reloaded chain did not continue: %+v", r)
	}
	if bad, err := l2.Verify(); err != nil {
		t.Fatalf("reloaded+appended chain must verify: bad=%d err=%v", bad, err)
	}
}

func TestSinkLoadRejectsTamperedChain(t *testing.T) {
	sink := &fakeSink{}
	l, _ := NewWithSink(sink)
	l.Append(Entry{Action: "a", TS: "t"})
	l.Append(Entry{Action: "b", TS: "t"})
	// tamper with a persisted record's content.
	sink.stored[0].Action = "tampered"
	if _, err := NewWithSink(sink); err == nil {
		t.Fatal("loading a tampered persisted chain must fail at startup")
	}
}

func TestSinkPersistFailureRollsBack(t *testing.T) {
	sink := &fakeSink{failOn: 1} // fail on the SECOND append
	l, _ := NewWithSink(sink)
	if _, err := l.Append(Entry{Action: "a", TS: "t"}); err != nil {
		t.Fatal(err)
	}
	if _, err := l.Append(Entry{Action: "b", TS: "t"}); err == nil {
		t.Fatal("a persist failure must surface as an error")
	}
	// memory and store stay consistent (both 1).
	if l.Len() != 1 || len(sink.stored) != 1 {
		t.Fatalf("rollback failed: len=%d stored=%d", l.Len(), len(sink.stored))
	}
}
