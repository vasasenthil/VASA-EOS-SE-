package integration

import "testing"

// Unit tests for the Exam Invigilation Duty Roster invariants: pure capacity/uniqueness/close gates plus the
// cross-session same-slot clash (exercised through a real Platform).

func baseDuty() DutySession {
	return DutySession{ID: "INV-T", OrgUnit: "SCH-T", Exam: "Half-yearly", Date: "2026-09-10", Slot: "FN", Hall: "Hall-A", RequiredInvigilators: 2, Status: DutyOpen}
}

func TestInvigilationCapacityAndUnique(t *testing.T) {
	d, _ := applyAssignDuty(baseDuty(), "SYN-T-1", "now")
	if _, err := applyAssignDuty(d, "SYN-T-1", "now"); err == nil {
		t.Fatal("expected a duplicate assignment to be rejected")
	}
	d, _ = applyAssignDuty(d, "SYN-T-2", "now") // 2/2 full
	if _, err := applyAssignDuty(d, "SYN-T-3", "now"); err == nil {
		t.Fatal("expected an over-capacity assignment to be rejected")
	}
}

func TestInvigilationNoCloseWhenUnderstaffed(t *testing.T) {
	d, _ := applyAssignDuty(baseDuty(), "SYN-T-1", "now") // 1/2
	if _, err := applyCloseDuty(d, "now"); err == nil {
		t.Fatal("expected closing an understaffed session to be rejected")
	}
	d, _ = applyAssignDuty(d, "SYN-T-2", "now") // 2/2
	out, err := applyCloseDuty(d, "now")
	if err != nil || out.Status != DutyClosed {
		t.Fatalf("expected closing a fully-staffed session to succeed, status=%s err=%v", out.Status, err)
	}
}

func TestInvigilationNoClash(t *testing.T) {
	p := newPlatform(t)
	mk := func(id, slot string) DutySession {
		return DutySession{ID: id, OrgUnit: "TN", Exam: "Half-yearly", Date: "2026-09-11", Slot: slot, Hall: "H", RequiredInvigilators: 2}
	}
	if _, err := p.CreateDutySession(mk("INV-UT-A", "FN")); err != nil {
		t.Fatalf("create A: %v", err)
	}
	if _, err := p.CreateDutySession(mk("INV-UT-B", "FN")); err != nil { // same date+slot
		t.Fatalf("create B: %v", err)
	}
	if _, err := p.CreateDutySession(mk("INV-UT-C", "AN")); err != nil { // same date, different slot
		t.Fatalf("create C: %v", err)
	}
	if _, err := p.AssignInvigilator("INV-UT-A", "SYN-T-CLASH"); err != nil {
		t.Fatalf("first assign should succeed: %v", err)
	}
	// Same teacher, same date+slot, different session → clash rejected.
	if _, err := p.AssignInvigilator("INV-UT-B", "SYN-T-CLASH"); err == nil {
		t.Fatal("expected a same-slot clash to be rejected")
	}
	// Same teacher, same date but different slot → allowed.
	if _, err := p.AssignInvigilator("INV-UT-C", "SYN-T-CLASH"); err != nil {
		t.Fatalf("expected a different-slot assignment to succeed: %v", err)
	}
}
