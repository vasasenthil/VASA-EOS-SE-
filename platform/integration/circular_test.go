package integration

import "testing"

// Unit tests for the Notice Board & Circulars invariants (pure transitions).

func baseCircular(target int) Circular {
	return Circular{ID: "CIR-T", OrgUnit: "SCH-T", Title: "Exam schedule", Category: "examination", TargetCount: target, Status: CircDraft}
}

func TestCircularNoAckBeforePublish(t *testing.T) {
	if _, err := applyAcknowledge(baseCircular(3), "SYN-T-1", "now"); err == nil {
		t.Fatal("expected acknowledging a draft (unpublished) circular to be rejected")
	}
}

func TestCircularUniqueAck(t *testing.T) {
	c, err := applyPublishCircular(baseCircular(3), "now")
	if err != nil {
		t.Fatalf("publish should succeed: %v", err)
	}
	c, err = applyAcknowledge(c, "SYN-T-1", "now")
	if err != nil {
		t.Fatalf("first ack should succeed: %v", err)
	}
	if _, err := applyAcknowledge(c, "SYN-T-1", "now"); err == nil {
		t.Fatal("expected a duplicate acknowledgement to be rejected")
	}
}

func TestCircularArchiveGate(t *testing.T) {
	c, _ := applyPublishCircular(baseCircular(3), "now")
	c, _ = applyAcknowledge(c, "SYN-T-1", "now")
	c, _ = applyAcknowledge(c, "SYN-T-2", "now")
	// 2 of 3 acknowledged → cannot archive.
	if _, err := applyArchiveCircular(c, "now"); err == nil {
		t.Fatal("expected archive to be rejected at 2/3 acknowledged")
	}
	// All acknowledged → archive succeeds.
	c, _ = applyAcknowledge(c, "SYN-T-3", "now")
	out, err := applyArchiveCircular(c, "now")
	if err != nil || out.Status != CircArchived {
		t.Fatalf("expected archive to succeed at 3/3, status=%s err=%v", out.Status, err)
	}
}
