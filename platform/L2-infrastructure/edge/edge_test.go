package edge

import "testing"

func TestLWWRegisterConverges(t *testing.T) {
	a := LWWRegister{Value: "Grade 1", TS: 10}
	b := LWWRegister{Value: "Grade 2", TS: 20}
	// merge is commutative and idempotent → both replicas land on the latest write.
	if a.Merge(b) != b.Merge(a) {
		t.Fatal("LWW merge must be commutative")
	}
	if a.Merge(b).Value != "Grade 2" {
		t.Fatalf("the higher-timestamp value must win, got %q", a.Merge(b).Value)
	}
	if a.Merge(b).Merge(b) != a.Merge(b) {
		t.Fatal("LWW merge must be idempotent")
	}
	// equal timestamps tie-break deterministically.
	x := LWWRegister{Value: "A", TS: 5}
	y := LWWRegister{Value: "B", TS: 5}
	if x.Merge(y) != y.Merge(x) {
		t.Fatal("equal-timestamp merge must still be commutative")
	}
}

func TestGCounterConverges(t *testing.T) {
	// two schools mark attendance offline, then sync.
	chn := NewGCounter()
	chn.Inc("chennai", 30)
	chn.Inc("chennai", 5) // 35
	mdu := NewGCounter()
	mdu.Inc("madurai", 22)

	// each replica merges the other (in either order) → same total, no lost writes.
	a := chn.Clone()
	a.Merge(mdu)
	b := mdu.Clone()
	b.Merge(chn)
	if a.Value() != 57 || b.Value() != 57 {
		t.Fatalf("counters must converge to 57, got %d / %d", a.Value(), b.Value())
	}
	// idempotent: re-merging changes nothing.
	a.Merge(mdu)
	if a.Value() != 57 {
		t.Fatalf("re-merge must be idempotent, got %d", a.Value())
	}
}

func TestORSetAddWinsAndConverges(t *testing.T) {
	// replica A enrols two pupils; replica B (offline) enrols one and unenrols another.
	A := NewORSet()
	A.Add("APAAR-1", "a1")
	A.Add("APAAR-2", "a2")
	B := NewORSet()
	B.Merge(A)             // B started from a synced copy
	B.Remove("APAAR-2")    // B unenrols pupil 2 offline
	A.Add("APAAR-2", "a3") // concurrently, A re-enrols pupil 2 (a transfer back)

	// converge: merge both ways.
	x := NewORSet()
	x.Merge(A)
	x.Merge(B)
	y := NewORSet()
	y.Merge(B)
	y.Merge(A)

	if len(x.Elements()) != len(y.Elements()) {
		t.Fatalf("OR-set must converge: %v vs %v", x.Elements(), y.Elements())
	}
	// add-wins: the concurrent re-add of APAAR-2 survives the remove.
	if !x.Contains("APAAR-2") {
		t.Fatalf("a concurrent re-add must win over a remove (add-wins), got %v", x.Elements())
	}
	if !x.Contains("APAAR-1") {
		t.Fatal("APAAR-1 must remain present")
	}
}

func TestORSetRemoveTombstones(t *testing.T) {
	s := NewORSet()
	s.Add("x", "t1")
	if !s.Contains("x") {
		t.Fatal("added element must be present")
	}
	s.Remove("x")
	if s.Contains("x") {
		t.Fatal("removed element (no concurrent re-add) must be absent")
	}
}
