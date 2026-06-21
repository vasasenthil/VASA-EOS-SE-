package integration

import (
	"context"
	"testing"

	"github.com/vasa-eos-se-tn/platform/reconcile"
)

func TestWalletCollectsAndVerifiesCredentials(t *testing.T) {
	p := newPlatform(t)
	const id = "SYN-APAAR-000000000041"
	udise := p.SchoolsGovernedBy("TN-DIST-Chennai").Sample[0]

	// empty wallet to start.
	if w := p.Wallet(id); w.Count != 0 || !w.AllValid {
		t.Fatalf("a new learner's wallet should be empty + vacuously valid: %+v", w)
	}

	// enrolment → an EnrolmentRecord credential lands in the wallet.
	apaar := reconcile.ApaarRecord{ApaarID: id, Name: "Anbu", DateOfBirth: "2018-06-01", Gender: "F", Category: "GEN", JourneyStatus: "enrolled"}
	local := reconcile.StudentRecord{ApaarID: id, Name: "Anbu", DOB: "2018-06-01", Gender: "F", Category: "GEN", Status: "Enrolled"}
	if out := p.EnrolViaAPAAR(context.Background(), APAAREnrolment{APAAR: apaar, Local: local, UDISE: udise, Class: "Grade 1"}); !out.Enrolled {
		t.Fatalf("enrolment setup failed: %+v", out)
	}
	// DBT → a BenefitReceipt credential lands in the wallet too.
	p.RecordSubsidyBasis("B-41", id)
	if out := p.DeliverDBT(context.Background(), DBTRequest{Scheme: "PUDHUMAI-PENN", Beneficiary: id, AmountINR: 1000}); !out.Delivered {
		t.Fatalf("DBT setup failed: %+v", out)
	}

	w := p.Wallet(id)
	if w.Count != 2 {
		t.Fatalf("wallet should hold the enrolment + DBT credentials, got %d", w.Count)
	}
	if !w.AllValid {
		t.Fatalf("every credential must verify (signature + notary proof): %+v", w.Credentials)
	}
	types := map[string]bool{}
	for _, c := range w.Credentials {
		if !c.Valid || len(c.Failures) != 0 {
			t.Fatalf("credential %s failed verification: %v", c.ID, c.Failures)
		}
		types[c.Type] = true
	}
	if !types["EnrolmentRecord"] || !types["BenefitReceipt"] {
		t.Fatalf("wallet must contain both an EnrolmentRecord and a BenefitReceipt: %+v", types)
	}
}

func TestWalletEmptyForUnknown(t *testing.T) {
	p := newPlatform(t)
	if w := p.Wallet("SYN-APAAR-999999999999"); w.Count != 0 {
		t.Fatalf("unknown learner must have an empty wallet, got %d", w.Count)
	}
}
