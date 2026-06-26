package integration

import "testing"

// Unit tests for the Diagnostic & Remedial (NIPUN FLN) invariants (pure transitions).

func baseBatch(cap int) RemedialBatch {
	return RemedialBatch{ID: "REM-T", OrgUnit: "SCH-T", Subject: "literacy", TargetLevel: 4, Capacity: cap, Status: RemedialOpen}
}

func TestRemedialEligibilityGate(t *testing.T) {
	// A student at or above the target is not remedial-eligible.
	if _, err := applyEnroll(baseBatch(10), "SYN-S-P", 4, "now"); err == nil {
		t.Fatal("expected enrolling an already-proficient student (level 4 ≥ target 4) to be rejected")
	}
}

func TestRemedialCapacity(t *testing.T) {
	b := baseBatch(2)
	b, _ = applyEnroll(b, "SYN-S-1", 1, "now")
	b, _ = applyEnroll(b, "SYN-S-2", 1, "now")
	if _, err := applyEnroll(b, "SYN-S-3", 1, "now"); err == nil {
		t.Fatal("expected a 3rd enrolment in a cap-2 batch to be rejected")
	}
}

func TestRemedialUniqueEnrolment(t *testing.T) {
	b, _ := applyEnroll(baseBatch(10), "SYN-S-1", 2, "now")
	if _, err := applyEnroll(b, "SYN-S-1", 2, "now"); err == nil {
		t.Fatal("expected a duplicate active enrolment to be rejected")
	}
}

func TestRemedialProficiencyGate(t *testing.T) {
	b, _ := applyEnroll(baseBatch(10), "SYN-S-1", 2, "now")
	// Below target → cannot graduate.
	if _, err := applyGraduate(b, "SYN-S-1", 3, "now"); err == nil {
		t.Fatal("expected graduation below the target (3 < 4) to be rejected")
	}
	// At target → graduate succeeds and frees a seat.
	out, err := applyGraduate(b, "SYN-S-1", 4, "now")
	if err != nil {
		t.Fatalf("expected graduation at the target to succeed: %v", err)
	}
	if out.ActiveCount() != 0 {
		t.Fatalf("expected the graduated student to free their seat, active=%d", out.ActiveCount())
	}
}

func TestRemedialSeatFreedAfterGraduation(t *testing.T) {
	b := baseBatch(1)
	b, _ = applyEnroll(b, "SYN-S-1", 1, "now")
	if _, err := applyEnroll(b, "SYN-S-2", 1, "now"); err == nil {
		t.Fatal("setup: cap-1 batch should reject a second enrolment")
	}
	b, _ = applyGraduate(b, "SYN-S-1", 4, "now")
	out, err := applyEnroll(b, "SYN-S-2", 1, "now")
	if err != nil {
		t.Fatalf("expected enrolment to succeed after a seat was freed: %v", err)
	}
	if out.ActiveCount() != 1 {
		t.Fatalf("expected 1 active enrolment after the swap, got %d", out.ActiveCount())
	}
}
