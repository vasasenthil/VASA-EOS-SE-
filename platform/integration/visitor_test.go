package integration

import "testing"

// Unit tests for the Visitor & Gate invariants: the pure no-double-check-out transition plus the statewide
// single-open-pass cross-store invariant (exercised through a real Platform).

func TestVisitorNoDoubleCheckOut(t *testing.T) {
	v := VisitorPass{ID: "VIS-T", OrgUnit: "SCH-T", VisitorID: "SYN-V-T", Name: "Visitor T", Purpose: "guest", Status: VisitorIn}
	out, err := applyCheckOut(v, "now")
	if err != nil || out.Status != VisitorOut {
		t.Fatalf("expected first check-out to succeed, status=%s err=%v", out.Status, err)
	}
	if _, err := applyCheckOut(out, "now"); err == nil {
		t.Fatal("expected a second check-out of an already checked-out pass to be rejected")
	}
}

func TestVisitorSingleOpenPass(t *testing.T) {
	p := newPlatform(t)
	mk := func(id string) VisitorPass {
		return VisitorPass{ID: id, OrgUnit: "TN", VisitorID: "SYN-V-UNIQTEST", Name: "Visitor", Purpose: "official", Host: "SYN-HM"}
	}
	if _, err := p.CheckInVisitor(mk("VIS-UT-1")); err != nil {
		t.Fatalf("first check-in should succeed: %v", err)
	}
	if _, err := p.CheckInVisitor(mk("VIS-UT-2")); err == nil {
		t.Fatal("expected a second concurrent open pass for the same visitor to be rejected")
	}
	// After check-out, a fresh check-in is allowed again.
	if _, err := p.CheckOutVisitor("VIS-UT-1"); err != nil {
		t.Fatalf("check-out should succeed: %v", err)
	}
	if _, err := p.CheckInVisitor(mk("VIS-UT-3")); err != nil {
		t.Fatalf("a fresh check-in after the visitor left should succeed: %v", err)
	}
}
