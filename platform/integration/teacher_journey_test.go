package integration

import (
	"context"
	"testing"

	"github.com/vasa-eos-se-tn/platform/adapters"
)

func TestTeacherProfileAssemblesService(t *testing.T) {
	p := newPlatform(t)
	const emp = "E-3001"
	udise := p.SchoolsGovernedBy("TN-DIST-Chennai").Sample[0]
	hrms := adapters.TeacherRecord{EmployeeID: emp, Name: "R. Anbu", Designation: "PG Assistant", SchoolUDISE: udise, Teaching: true}
	if out := p.OnboardTeacher(context.Background(), TeacherOnboarding{HRMS: hrms, Local: hrms, UDISE: udise}); !out.Onboarded {
		t.Fatalf("setup onboarding failed: %+v", out)
	}

	prof := p.TeacherProfile(emp)
	if !prof.Found || prof.EmployeeID != emp {
		t.Fatalf("the staff member must be found: %+v", prof)
	}
	// the employment lawful basis + a verified service-record posting are present.
	if len(prof.LawfulBases) == 0 {
		t.Fatal("a §7 employment lawful basis must be on file")
	}
	if len(prof.Postings) != 1 || prof.CurrentPosting == nil {
		t.Fatalf("there must be one current posting: %+v", prof.Postings)
	}
	post := prof.CurrentPosting
	if post.UDISE != udise || post.Cadre != "teaching" || !post.Valid {
		t.Fatalf("the posting is wrong: %+v", post)
	}
	if !prof.Wallet.AllValid || prof.Wallet.Count == 0 {
		t.Fatalf("the wallet must hold a verifiable service credential: %+v", prof.Wallet)
	}
	if prof.EventCount == 0 || !prof.Verified {
		t.Fatalf("the audit timeline must be present + verified: %+v", prof)
	}
}

func TestTeacherProfileRevokedPostingHasNoCurrent(t *testing.T) {
	p := newPlatform(t)
	const emp = "E-3002"
	udise := p.SchoolsGovernedBy("TN-DIST-Chennai").Sample[0]
	hrms := adapters.TeacherRecord{EmployeeID: emp, Name: "S. Bala", Designation: "BT Assistant", SchoolUDISE: udise, Teaching: true}
	out := p.OnboardTeacher(context.Background(), TeacherOnboarding{HRMS: hrms, Local: hrms, UDISE: udise})
	if !out.Onboarded {
		t.Fatalf("setup failed: %+v", out)
	}
	// revoke the service credential (e.g. transferred / retired).
	p.RevokeCredential(out.Credential.Signed.Credential.ID, "HRMS", "retired")
	prof := p.TeacherProfile(emp)
	if prof.CurrentPosting != nil {
		t.Fatalf("a revoked posting must leave no current posting: %+v", prof.CurrentPosting)
	}
	if len(prof.Postings) != 1 || prof.Postings[0].Valid {
		t.Fatalf("the (revoked) posting must remain in the history, invalid: %+v", prof.Postings)
	}
}

func TestTeacherProfileEmptyForUnknown(t *testing.T) {
	p := newPlatform(t)
	if prof := p.TeacherProfile("E-NOPE"); prof.Found {
		t.Fatalf("an unknown employee must have an empty profile: %+v", prof)
	}
}
