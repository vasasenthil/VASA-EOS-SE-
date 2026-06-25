package offswitch

import (
	"crypto/ed25519"
	"testing"
)

func mkHolders(t *testing.T, n int) (Quorum, map[string]ed25519.PrivateKey) {
	t.Helper()
	q := Quorum{Holders: map[string]ed25519.PublicKey{}, Threshold: 0}
	priv := map[string]ed25519.PrivateKey{}
	for i := 0; i < n; i++ {
		pub, sk, err := ed25519.GenerateKey(nil)
		if err != nil {
			t.Fatal(err)
		}
		id := string(rune('A' + i))
		q.Holders[id] = pub
		priv[id] = sk
	}
	return q, priv
}

func sign(priv ed25519.PrivateKey, r Request) Approval {
	return Approval{Signature: ed25519.Sign(priv, r.CanonicalBytes())}
}

func TestMofN_RequiresThresholdDistinctHolders(t *testing.T) {
	q, priv := mkHolders(t, 5)
	q.Threshold = 3 // 3-of-5
	s, err := New(q)
	if err != nil {
		t.Fatal(err)
	}
	req := Request{ID: "req-1", Action: Engage, Target: "platform", CreatedAt: "2026-06-19T00:00:00Z"}

	// 2 approvals — below threshold, not engaged
	for _, id := range []string{"A", "B"} {
		ap := sign(priv[id], req)
		ap.HolderID = id
		ok, _ := s.Submit(req, ap)
		if ok {
			t.Fatalf("authorised at %d approvals; threshold is 3", s.Distinct("req-1"))
		}
	}
	if s.Engaged() {
		t.Fatal("engaged below quorum")
	}
	// 3rd distinct approval crosses the threshold
	ap := sign(priv["C"], req)
	ap.HolderID = "C"
	ok, err := s.Submit(req, ap)
	if err != nil || !ok {
		t.Fatalf("expected authorisation at 3-of-5; ok=%v err=%v", ok, err)
	}
	if !s.Engaged() {
		t.Fatal("not engaged after quorum")
	}
}

func TestDuplicateHolderDoesNotCountTwice(t *testing.T) {
	q, priv := mkHolders(t, 3)
	q.Threshold = 2
	s, _ := New(q)
	req := Request{ID: "r", Action: Engage, Target: "p", CreatedAt: "t"}
	ap := sign(priv["A"], req)
	ap.HolderID = "A"
	_, _ = s.Submit(req, ap)
	_, _ = s.Submit(req, ap) // same holder again
	if s.Distinct("r") != 1 {
		t.Fatalf("duplicate holder counted: %d", s.Distinct("r"))
	}
	if s.Engaged() {
		t.Fatal("engaged from a single holder's repeated approval")
	}
}

func TestInvalidSignatureRejected(t *testing.T) {
	q, priv := mkHolders(t, 3)
	q.Threshold = 1
	s, _ := New(q)
	req := Request{ID: "r", Action: Engage, Target: "p", CreatedAt: "t"}
	// sign a DIFFERENT request, submit against this one
	bad := sign(priv["A"], Request{ID: "other", Action: Engage, Target: "p", CreatedAt: "t"})
	bad.HolderID = "A"
	if _, err := s.Submit(req, bad); err == nil {
		t.Fatal("expected invalid-signature error")
	}
	if s.Engaged() {
		t.Fatal("engaged on a forged approval")
	}
}

func TestUnknownHolderRejected(t *testing.T) {
	q, _ := mkHolders(t, 2)
	q.Threshold = 1
	s, _ := New(q)
	req := Request{ID: "r", Action: Engage, Target: "p", CreatedAt: "t"}
	if _, err := s.Submit(req, Approval{HolderID: "Z", Signature: []byte("x")}); err == nil {
		t.Fatal("expected unknown-holder error")
	}
}

func TestReplayRejectedAfterExecution(t *testing.T) {
	q, priv := mkHolders(t, 3)
	q.Threshold = 1
	s, _ := New(q)
	req := Request{ID: "once", Action: Engage, Target: "p", CreatedAt: "t"}
	ap := sign(priv["A"], req)
	ap.HolderID = "A"
	if ok, _ := s.Submit(req, ap); !ok {
		t.Fatal("first submit should authorise at 1-of-3")
	}
	if _, err := s.Submit(req, ap); err == nil {
		t.Fatal("replay of an executed request must be rejected")
	}
}

func TestEngageThenDisengage(t *testing.T) {
	q, priv := mkHolders(t, 3)
	q.Threshold = 2
	s, _ := New(q)
	eng := Request{ID: "e", Action: Engage, Target: "p", CreatedAt: "t"}
	for _, id := range []string{"A", "B"} {
		ap := sign(priv[id], eng)
		ap.HolderID = id
		s.Submit(eng, ap)
	}
	if !s.Engaged() {
		t.Fatal("should be engaged")
	}
	dis := Request{ID: "d", Action: Disengage, Target: "p", CreatedAt: "t"}
	for _, id := range []string{"B", "C"} {
		ap := sign(priv[id], dis)
		ap.HolderID = id
		s.Submit(dis, ap)
	}
	if s.Engaged() {
		t.Fatal("should be disengaged after a 2-of-3 disengage")
	}
	// audit must record both executions
	var execs int
	for _, e := range s.Audit() {
		if e.Kind == "executed" {
			execs++
		}
	}
	if execs != 2 {
		t.Fatalf("expected 2 executed audit events, got %d", execs)
	}
}

func TestNewRejectsBadQuorum(t *testing.T) {
	q, _ := mkHolders(t, 2)
	q.Threshold = 3 // > holders
	if _, err := New(q); err == nil {
		t.Fatal("expected error: threshold exceeds holders")
	}
}
