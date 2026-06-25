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
		Payload: map[string]any{"category": "aadhaar", "tenant": "TN/Chennai", "statutory": true}, // class-1 PII, §7 basis
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

func TestOnboardConsultsLiveConsentRegister(t *testing.T) {
	p := newPlatform(t)
	// a Class-2 record referencing a principal + purpose with NO grant on file → quarantined at consent.
	noGrant := onboarding.Record{
		ID: "REC-5", Source: "internal", Channel: "web", Region: "TN-SDC",
		Payload: map[string]any{"category": "marks", "tenant": "TN/Chennai", "principal": "STU-77", "purpose": "ai-tutoring"},
	}
	if res := p.Onboard(context.Background(), noGrant, "DGE"); res.FailedStep != onboarding.Consent {
		t.Fatalf("class-2 PII without a live grant must quarantine at consent: %+v", res)
	}
	// record a live consent grant, then the same record passes the consent step (and all 12).
	if _, err := p.RecordConsent("REC-5-G", "STU-77", "ai-tutoring", "consent", true, "PARENT-77"); err != nil {
		t.Fatal(err)
	}
	withGrant := onboarding.Record{
		ID: "REC-6", Source: "internal", Channel: "web", Region: "TN-SDC",
		Payload: map[string]any{"category": "marks", "tenant": "TN/Chennai", "principal": "STU-77", "purpose": "ai-tutoring"},
	}
	res := p.Onboard(context.Background(), withGrant, "DGE")
	if !res.Accepted || len(res.Passed) != 12 {
		t.Fatalf("a class-2 record with a live consent grant should pass all 12 steps: %+v", res)
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
