package integration

import (
	"context"
	"testing"

	"github.com/vasa-eos-se-tn/platform/reconcile"
)

func TestRevocationInvalidatesCredentialInWallet(t *testing.T) {
	p := newPlatform(t)
	const id = "SYN-APAAR-000000000051"
	udise := p.SchoolsGovernedBy("TN-DIST-Chennai").Sample[0]
	apaar := reconcile.ApaarRecord{ApaarID: id, Name: "Anbu", DateOfBirth: "2018-06-01", Gender: "F", Category: "GEN", JourneyStatus: "enrolled"}
	local := reconcile.StudentRecord{ApaarID: id, Name: "Anbu", DOB: "2018-06-01", Gender: "F", Category: "GEN", Status: "Enrolled"}
	out := p.EnrolViaAPAAR(context.Background(), APAAREnrolment{APAAR: apaar, Local: local, UDISE: udise, Class: "Grade 1"})
	if !out.Enrolled {
		t.Fatalf("enrolment setup failed: %+v", out)
	}
	credID := out.Credential.Signed.Credential.ID

	// before revocation: the credential verifies.
	w0 := p.Wallet(id)
	if !w0.AllValid || !w0.Credentials[0].Valid || w0.Credentials[0].Revoked {
		t.Fatalf("a fresh credential must verify and not be revoked: %+v", w0.Credentials[0])
	}

	// revoke it.
	before := p.Audit.Len()
	rev := p.RevokeCredential(credID, "DEO-Chennai", "superseded by transfer")
	if !rev.Revoked || rev.CredentialID != credID {
		t.Fatalf("revocation record wrong: %+v", rev)
	}
	if p.Audit.Len() <= before {
		t.Fatal("revocation must be audited")
	}

	// after revocation: the wallet reflects it — the credential is invalid + revoked even though the crypto
	// still verifies.
	w := p.Wallet(id)
	e := w.Credentials[0]
	if e.Valid || !e.Revoked {
		t.Fatalf("a revoked credential must be invalid + flagged revoked: %+v", e)
	}
	found := false
	for _, f := range e.Failures {
		if f == "REVOKED" {
			found = true
		}
	}
	if !found {
		t.Fatalf("a revoked credential must list the REVOKED failure: %v", e.Failures)
	}
	if w.AllValid {
		t.Fatal("the wallet must not be all-valid once a credential is revoked")
	}
}

func TestRevocationStatusUnknown(t *testing.T) {
	p := newPlatform(t)
	if _, ok := p.RevocationStatus("NOPE"); ok {
		t.Fatal("an un-revoked credential must not show as revoked")
	}
}
