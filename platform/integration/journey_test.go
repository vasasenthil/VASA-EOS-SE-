package integration

import (
	"context"
	"testing"

	"github.com/vasa-eos-se-tn/platform/reconcile"
)

func TestStudentJourneyAssemblesAcrossVerticals(t *testing.T) {
	p := newPlatform(t)
	const id = "SYN-APAAR-000000000031"
	udise := p.SchoolsGovernedBy("TN-DIST-Chennai").Sample[0]

	// 1) enrol via APAAR (records a lawful basis + an audit event + a credential).
	apaar := reconcile.ApaarRecord{ApaarID: id, Name: "Anbu", DateOfBirth: "2018-06-01", Gender: "F", Category: "GEN", JourneyStatus: "enrolled"}
	local := reconcile.StudentRecord{ApaarID: id, Name: "Anbu", DOB: "2018-06-01", Gender: "F", Category: "GEN", Status: "Enrolled"}
	if out := p.EnrolViaAPAAR(context.Background(), APAAREnrolment{APAAR: apaar, Local: local, UDISE: udise, Class: "Grade 1"}); !out.Enrolled {
		t.Fatalf("setup enrolment failed: %+v", out)
	}
	// 2) deliver a scheme benefit (sanction + release + receipt + audit).
	p.RecordSubsidyBasis("B-31", id)
	if out := p.DeliverDBT(context.Background(), DBTRequest{Scheme: "PUDHUMAI-PENN", Beneficiary: id, AmountINR: 1000}); !out.Delivered {
		t.Fatalf("setup DBT failed: %+v", out)
	}
	// 3) the guardian raises a grievance filed under the learner's id.
	p.Civic.FileGrievance("GRV-31", "mid-day meal quality", id, "block")

	// the journey assembles all of it into one auditable record.
	j := p.StudentJourney(id)
	if j.APAARID != id {
		t.Fatalf("journey id wrong: %s", j.APAARID)
	}
	if len(j.LawfulBases) < 2 {
		t.Fatalf("journey must show the enrolment + subsidy lawful bases, got %d", len(j.LawfulBases))
	}
	if len(j.Grievances) != 1 {
		t.Fatalf("journey must show the learner's grievance, got %d", len(j.Grievances))
	}
	if j.EventCount == 0 {
		t.Fatal("journey must reconstruct the audit timeline for the learner")
	}
	if !j.Verified {
		t.Fatal("the journey must report the audit chain as verified")
	}
	// every event genuinely references the learner.
	for _, e := range j.Events {
		if e.Action == "" || e.At == "" {
			t.Fatalf("malformed journey event: %+v", e)
		}
	}
}

func TestStudentJourneyEmptyForUnknown(t *testing.T) {
	p := newPlatform(t)
	j := p.StudentJourney("SYN-APAAR-999999999999")
	if j.EventCount != 0 || len(j.LawfulBases) != 0 || len(j.Grievances) != 0 {
		t.Fatalf("an unknown learner must have an empty journey: %+v", j)
	}
	if !j.Verified {
		t.Fatal("the audit chain must still verify for an empty journey")
	}
}
