package integration

import (
	"context"
	"testing"

	"github.com/vasa-eos-se-tn/platform/onboarding"
)

func TestOnboardCleanRecordAccepted(t *testing.T) {
	p := newPlatform(t)
	r := onboarding.Record{
		ID: "REC-1", Source: "internal", Channel: "web", Region: "TN-SDC",
		Payload: map[string]any{"category": "name", "tenant": "TN/Chennai", "datatype": "row", "consent": true},
	}
	res := p.Onboard(context.Background(), r, "APAAR Nodal")
	if !res.Accepted || res.Quarantined {
		t.Fatalf("a clean class-3 record should pass all 12 steps: %+v", res)
	}
	if len(res.Passed) != 12 {
		t.Fatalf("expected 12 steps passed, got %d", len(res.Passed))
	}
}

func TestOnboardClass1PiiOffshoreQuarantined(t *testing.T) {
	p := newPlatform(t)
	r := onboarding.Record{
		ID: "REC-2", Source: "internal", Channel: "web", Region: "AWS-Mumbai",
		Payload: map[string]any{"category": "aadhaar", "tenant": "TN/Chennai", "consent": true}, // class-1 PII
	}
	res := p.Onboard(context.Background(), r, "APAAR Nodal")
	if res.Accepted || res.FailedStep != onboarding.Residency {
		t.Fatalf("Class-1 PII offshore must be quarantined at residency: %+v", res)
	}
	// quarantine alerts the steward (an inbox notification was dispatched)
	if !res.Alerted {
		t.Fatal("a quarantine must alert the steward + Compliance Lead")
	}
}

func TestOnboardMinorPiiWithoutConsentQuarantined(t *testing.T) {
	p := newPlatform(t)
	r := onboarding.Record{
		ID: "REC-3", Source: "internal", Channel: "web", Region: "TN-SDC",
		Payload: map[string]any{"category": "marks", "tenant": "TN/Chennai"}, // class-2, no consent/statutory
	}
	res := p.Onboard(context.Background(), r, "DGE")
	if res.FailedStep != onboarding.Consent {
		t.Fatalf("class-2 PII without a lawful basis must quarantine at consent: %+v", res)
	}
}

func TestOnboardUnsignedSourceRejected(t *testing.T) {
	p := newPlatform(t)
	r := onboarding.Record{ID: "REC-4", Source: "APAAR", Channel: "web", Region: "TN-SDC",
		Payload: map[string]any{"category": "name", "tenant": "TN/Chennai", "consent": true}} // no signature
	res := p.Onboard(context.Background(), r, "APAAR Nodal")
	if res.FailedStep != onboarding.Authenticity {
		t.Fatalf("an unsigned external record must quarantine at authenticity: %+v", res)
	}
}
