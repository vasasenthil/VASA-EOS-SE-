package integration

import (
	"context"
	"testing"

	"github.com/vasa-eos-se-tn/platform/adapters"
)

func TestOnboardTeacherCleanIssuesServiceCredential(t *testing.T) {
	p := newPlatform(t)
	udise := p.SchoolsGovernedBy("TN-DIST-Chennai").Sample[0]
	hrms := adapters.TeacherRecord{EmployeeID: "E-2001", Name: "R. Anbu", Designation: "PG Assistant", SchoolUDISE: udise, Teaching: true}
	local := hrms // clean match
	before := p.Audit.Len()
	out := p.OnboardTeacher(context.Background(), TeacherOnboarding{HRMS: hrms, Local: local, UDISE: udise})
	if out.Refused || !out.Onboarded {
		t.Fatalf("a clean staff onboarding must succeed: %+v", out)
	}
	if !out.Reconciled || out.CriticalDrift != 0 || out.Credential == nil {
		t.Fatalf("onboarding must reconcile + issue a service credential: %+v", out)
	}
	if out.District != "Chennai" {
		t.Fatalf("the posting district should resolve, got %q", out.District)
	}
	if p.Audit.Len() <= before {
		t.Fatal("onboarding must extend the audit chain")
	}
	// the service credential lands in the staff member's verifiable wallet and verifies.
	w := p.Wallet("E-2001")
	if w.Count == 0 || !w.AllValid {
		t.Fatalf("the service credential must be in a verifiable wallet: %+v", w)
	}
	// the §7 employment lawful basis is recorded.
	if ok, _ := p.Consent.HasLawfulBasis("E-2001", "staff-hrms"); !ok {
		t.Fatal("the staff member must hold a recorded employment lawful basis")
	}
}

func TestOnboardTeacherIdentityDriftBlocks(t *testing.T) {
	p := newPlatform(t)
	udise := p.SchoolsGovernedBy("TN-DIST-Chennai").Sample[0]
	hrms := adapters.TeacherRecord{EmployeeID: "E-2002", Name: "R. Anbu", Designation: "BT Assistant", SchoolUDISE: udise, Teaching: true}
	// the school submitted a different name → identity-critical drift.
	local := adapters.TeacherRecord{EmployeeID: "E-2002", Name: "S. Bala", Designation: "BT Assistant", SchoolUDISE: udise, Teaching: true}
	out := p.OnboardTeacher(context.Background(), TeacherOnboarding{HRMS: hrms, Local: local, UDISE: udise})
	if !out.Refused || out.Onboarded || out.CriticalDrift == 0 {
		t.Fatalf("identity drift must block staff onboarding: %+v", out)
	}
	if out.Credential != nil {
		t.Fatal("no credential may be issued on a blocked onboarding")
	}
}

func TestOnboardTeacherUnknownSchool(t *testing.T) {
	p := newPlatform(t)
	hrms := adapters.TeacherRecord{EmployeeID: "E-2003", Name: "C. Cholan", Designation: "SGT", Teaching: true}
	out := p.OnboardTeacher(context.Background(), TeacherOnboarding{HRMS: hrms, Local: hrms, UDISE: "00000000000"})
	if !out.Refused || out.Onboarded {
		t.Fatalf("posting to a non-existent school must be refused: %+v", out)
	}
}
