package pep

import (
	"context"
	"os"
	"os/exec"
	"path/filepath"
	"testing"
)

// findOPA locates an opa binary: $OPA_BIN, then PATH. Returns "" if unavailable (test skips).
func findOPA() string {
	if b := os.Getenv("OPA_BIN"); b != "" {
		return b
	}
	if p, err := exec.LookPath("opa"); err == nil {
		return p
	}
	// the build-from-source location used in this repo's environment
	if _, err := os.Stat("/tmp/gobin/opa"); err == nil {
		return "/tmp/gobin/opa"
	}
	return ""
}

// policyDir resolves the repo's policies/ directory relative to this package.
func policyDir(t *testing.T) string {
	t.Helper()
	// package lives at platform/L5-security/pep ; policies/ is three levels up.
	dir, err := filepath.Abs(filepath.Join("..", "..", "..", "policies"))
	if err != nil {
		t.Fatal(err)
	}
	if _, err := os.Stat(filepath.Join(dir, "decision.rego")); err != nil {
		t.Skipf("policy corpus not found at %s: %v", dir, err)
	}
	return dir
}

// livePEP wires a PEP to the real Rego plane, or skips.
func livePEP(t *testing.T) *PEP {
	t.Helper()
	bin := findOPA()
	if bin == "" {
		t.Skip("opa binary not available; PEP↔PDP integration test skipped (runs in CI)")
	}
	p, err := New("app", NewOPADecider(bin, policyDir(t)))
	if err != nil {
		t.Fatal(err)
	}
	return p
}

// A teacher writing marks is RBAC-granted and regulation-clean → permit.
func TestLive_TeacherMarksPermitted(t *testing.T) {
	p := livePEP(t)
	d := p.Authorize(context.Background(), Request{
		Subject: Subject{Role: "TEACHER"},
		Action:  "marks.write",
	})
	if d.Err != nil {
		t.Fatalf("unexpected error: %v", d.Err)
	}
	if !d.Allowed() {
		t.Fatalf("teacher marks.write should permit, got %q (%v)", d.Effect, d.Reasons)
	}
}

// Expelling a 9-year-old is denied by RTE §16 regardless of role.
func TestLive_ExpelChildDenied(t *testing.T) {
	p := livePEP(t)
	d := p.Authorize(context.Background(), Request{
		Subject:  Subject{Role: "HEAD_TEACHER"},
		Action:   "student.expel",
		Resource: Resource{Type: "student", Attributes: map[string]any{"age": 9}},
	})
	if d.Effect != Deny {
		t.Fatalf("expelling a 9yo must be denied (RTE-NO-DETENTION), got %q", d.Effect)
	}
	if !contains(d.Reasons, "RTE-NO-DETENTION") {
		t.Fatalf("expected RTE-NO-DETENTION in governing, got %v", d.Reasons)
	}
}

// Rejecting an EWS applicant while the quota is unmet requires DEO/BEO approval.
func TestLive_EWSRejectRequiresApproval(t *testing.T) {
	p := livePEP(t)
	d := p.Authorize(context.Background(), Request{
		Subject:  Subject{Role: "HEAD_TEACHER"},
		Action:   "admission.reject",
		Resource: Resource{Type: "application", Attributes: map[string]any{"category": "EWS", "quotaFull": false}},
	})
	if !d.NeedsApproval() {
		t.Fatalf("EWS rejection with quota unmet should require approval, got %q (%v)", d.Effect, d.Reasons)
	}
	if !contains(d.Reasons, "RTE-EWS-QUOTA") {
		t.Fatalf("expected RTE-EWS-QUOTA, got %v", d.Reasons)
	}
}

// Processing a minor's PII without guardian consent is denied by DPDP §9.
func TestLive_MinorPIIWithoutConsentDenied(t *testing.T) {
	p := livePEP(t)
	d := p.Authorize(context.Background(), Request{
		Subject:  Subject{Role: "TEACHER"},
		Action:   "pii.process",
		Resource: Resource{Type: "student", Attributes: map[string]any{"age": 12, "consent": true, "guardianConsent": false}},
	})
	if d.Effect != Deny {
		t.Fatalf("minor PII without guardian consent must be denied (DPDP-CONSENT), got %q", d.Effect)
	}
	if !contains(d.Reasons, "DPDP-CONSENT") {
		t.Fatalf("expected DPDP-CONSENT, got %v", d.Reasons)
	}
}

func contains(xs []string, s string) bool {
	for _, x := range xs {
		if x == s {
			return true
		}
	}
	return false
}
