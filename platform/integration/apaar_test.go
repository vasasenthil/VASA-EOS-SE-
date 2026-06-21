package integration

import (
	"context"
	"testing"

	"github.com/vasa-eos-se-tn/platform/reconcile"
)

// aRealSchool returns a real UDISE leaf from the populated estate.
func aRealSchool(p *Platform) string {
	return p.SchoolsGovernedBy("TN-DIST-Chennai").Sample[0]
}

func TestEnrolViaAPAARClean(t *testing.T) {
	p := newPlatform(t)
	udise := aRealSchool(p)
	apaar := reconcile.ApaarRecord{ApaarID: "SYN-APAAR-000000000021", Name: "Anbu", DateOfBirth: "2018-06-01", Gender: "F", Category: "GEN", JourneyStatus: "enrolled"}
	local := reconcile.StudentRecord{ApaarID: apaar.ApaarID, Name: "Anbu", DOB: "2018-06-01", Gender: "F", Category: "GEN", Status: "Enrolled"}
	before := p.Audit.Len()
	out := p.EnrolViaAPAAR(context.Background(), APAAREnrolment{APAAR: apaar, Local: local, UDISE: udise, Class: "Grade 1"})
	if out.Refused || !out.Enrolled {
		t.Fatalf("a clean, real-school enrolment must succeed: %+v", out)
	}
	if !out.Reconciled || out.CriticalDrift != 0 || out.Credential == nil {
		t.Fatalf("enrolment must reconcile + issue a credential: %+v", out)
	}
	if out.District != "Chennai" {
		t.Fatalf("the enrolment should resolve the school's district, got %q", out.District)
	}
	if p.Audit.Len() <= before {
		t.Fatal("enrolment must extend the audit chain")
	}
}

func TestEnrolViaAPAARIdentityDriftBlocks(t *testing.T) {
	p := newPlatform(t)
	udise := aRealSchool(p)
	apaar := reconcile.ApaarRecord{ApaarID: "SYN-APAAR-000000000022", Name: "Anbu", DateOfBirth: "2018-06-01", Gender: "F", Category: "GEN", JourneyStatus: "enrolled"}
	// the school submitted a different name + DOB → identity-critical drift.
	local := reconcile.StudentRecord{ApaarID: apaar.ApaarID, Name: "Bala", DOB: "2017-01-01", Gender: "F", Category: "GEN", Status: "Enrolled"}
	out := p.EnrolViaAPAAR(context.Background(), APAAREnrolment{APAAR: apaar, Local: local, UDISE: udise, Class: "Grade 1"})
	if !out.Refused || out.Enrolled || out.CriticalDrift == 0 {
		t.Fatalf("identity-critical drift must block enrolment: %+v", out)
	}
	if out.Credential != nil {
		t.Fatal("no credential may be issued on a blocked enrolment")
	}
}

func TestEnrolViaAPAARUnknownSchool(t *testing.T) {
	p := newPlatform(t)
	apaar := reconcile.ApaarRecord{ApaarID: "SYN-APAAR-000000000023", Name: "Cholan", DateOfBirth: "2018-01-01", Gender: "M", Category: "GEN", JourneyStatus: "enrolled"}
	local := reconcile.StudentRecord{ApaarID: apaar.ApaarID, Name: "Cholan", DOB: "2018-01-01", Gender: "M", Category: "GEN", Status: "Enrolled"}
	out := p.EnrolViaAPAAR(context.Background(), APAAREnrolment{APAAR: apaar, Local: local, UDISE: "99999999999", Class: "Grade 1"})
	if !out.Refused || out.Enrolled {
		t.Fatalf("enrolment to a non-existent school must be refused: %+v", out)
	}
}
