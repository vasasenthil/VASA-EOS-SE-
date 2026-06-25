package integration

import (
	"context"
	"testing"
)

func TestComplianceFindingsRequireSignoff(t *testing.T) {
	p := newPlatform(t)
	// a school with two breaches: EWS quota not met (RTE §12) + no accessible infra (RPwD §16).
	out := p.CheckCompliance(context.Background(), ComplianceRequest{
		School: "33010100101",
		Facts: map[string]string{
			"ews_quota_met": "no", "ptr_compliant": "yes", "accessible_infra": "no",
			"consent_recorded": "yes", "child_safety_policy": "yes", "detention_practiced": "no",
		},
	})
	if out.Clean || len(out.Findings) != 2 {
		t.Fatalf("expected 2 findings (RTE quota + RPwD accessibility), got %+v", out.Findings)
	}
	if !out.RequiresSignoff || out.RequestID == "" {
		t.Fatalf("findings must require a compliance officer's sign-off: %+v", out)
	}
	// each finding cites its statute.
	statutes := map[string]bool{}
	for _, f := range out.Findings {
		if f.Statute == "" || f.Detail == "" {
			t.Fatalf("a finding must cite its statute + rationale: %+v", f)
		}
		statutes[f.Statute] = true
	}
	if !statutes["RTE Act 2009 §12"] || !statutes["RPwD Act 2016 §16"] {
		t.Fatalf("findings must cite the RTE + RPwD clauses, got %v", statutes)
	}
	// a compliance officer signs off.
	before := p.Audit.Len()
	if _, err := p.SignoffCompliance(context.Background(), out.RequestID, true, "G6-Compliance"); err != nil {
		t.Fatalf("the compliance officer should be able to sign off: %v", err)
	}
	if p.Audit.Len() <= before {
		t.Fatal("a sign-off must be audited")
	}
}

func TestComplianceCleanSchool(t *testing.T) {
	p := newPlatform(t)
	out := p.CheckCompliance(context.Background(), ComplianceRequest{
		School: "33010100102",
		Facts: map[string]string{
			"ews_quota_met": "yes", "ptr_compliant": "yes", "accessible_infra": "yes",
			"consent_recorded": "yes", "child_safety_policy": "yes", "detention_practiced": "no",
		},
	})
	if !out.Clean || len(out.Findings) != 0 || out.RequiresSignoff {
		t.Fatalf("a fully-compliant school must have no findings + no sign-off: %+v", out)
	}
}
