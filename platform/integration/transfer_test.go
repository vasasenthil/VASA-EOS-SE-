package integration

import (
	"context"
	"testing"

	"github.com/vasa-eos-se-tn/platform/reconcile"
)

func TestTransferPreservesJourney(t *testing.T) {
	p := newPlatform(t)
	const id = "SYN-APAAR-000000000061"
	from := p.SchoolsGovernedBy("TN-DIST-Chennai").Sample[0]
	to := p.SchoolsGovernedBy("TN-DIST-Madurai").Sample[0]

	// enrol at the source school.
	apaar := reconcile.ApaarRecord{ApaarID: id, Name: "Anbu", DateOfBirth: "2018-06-01", Gender: "F", Category: "GEN", JourneyStatus: "enrolled"}
	local := reconcile.StudentRecord{ApaarID: id, Name: "Anbu", DOB: "2018-06-01", Gender: "F", Category: "GEN", Status: "Enrolled"}
	if out := p.EnrolViaAPAAR(context.Background(), APAAREnrolment{APAAR: apaar, Local: local, UDISE: from, Class: "Grade 1"}); !out.Enrolled {
		t.Fatalf("enrolment setup failed: %+v", out)
	}
	eventsBefore := p.StudentJourney(id).EventCount

	// transfer to a school in another district.
	out := p.TransferStudent(context.Background(), TransferRequest{APAARID: id, FromUDISE: from, ToUDISE: to, Class: "Grade 2"})
	if out.Refused || !out.Transferred {
		t.Fatalf("a valid transfer must succeed: %+v", out)
	}
	if out.FromDistrict != "Chennai" || out.ToDistrict != "Madurai" {
		t.Fatalf("transfer must resolve both districts, got %s -> %s", out.FromDistrict, out.ToDistrict)
	}
	if out.OldCredRevoked == "" || out.NewCredential == nil {
		t.Fatalf("transfer must revoke the old enrolment + issue a new one: %+v", out)
	}

	// the wallet now holds the OLD (revoked) and the NEW (valid) enrolment — history travels with the learner.
	w := p.Wallet(id)
	var oldValid, newValid, revokedCount int
	for _, c := range w.Credentials {
		if c.Type != "EnrolmentRecord" {
			continue
		}
		if c.Revoked {
			revokedCount++
		} else if c.Valid {
			newValid++
		}
		_ = oldValid
	}
	if revokedCount != 1 || newValid != 1 {
		t.Fatalf("wallet should show 1 revoked + 1 valid enrolment, got revoked=%d valid=%d", revokedCount, newValid)
	}
	// the new active enrolment is at the destination school.
	if got := p.activeEnrolmentAt(id, to); got == "" {
		t.Fatal("the learner must have an active enrolment at the destination school")
	}
	if got := p.activeEnrolmentAt(id, from); got != "" {
		t.Fatal("the learner must NOT have an active enrolment at the source school after transfer")
	}
	// the journey grew (it did not reset) — the learner did not start over.
	if p.StudentJourney(id).EventCount <= eventsBefore {
		t.Fatal("the journey must carry across (grow), not reset, on transfer")
	}
}

func TestTransferRefusals(t *testing.T) {
	p := newPlatform(t)
	const id = "SYN-APAAR-000000000062"
	to := p.SchoolsGovernedBy("TN-DIST-Madurai").Sample[0]
	// no enrolment yet → nothing to transfer.
	if out := p.TransferStudent(context.Background(), TransferRequest{APAARID: id, ToUDISE: to}); !out.Refused {
		t.Fatalf("transferring a non-enrolled learner must be refused: %+v", out)
	}
	// unknown destination → refused.
	if out := p.TransferStudent(context.Background(), TransferRequest{APAARID: id, ToUDISE: "00000000000"}); !out.Refused {
		t.Fatalf("an unknown destination must be refused: %+v", out)
	}
}
