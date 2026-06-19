package onboarding

import (
	"context"
	"errors"
	"testing"
)

// ── permissive fakes; individual tests flip one to a failing variant ──
type okSchema struct{}

func (okSchema) Valid(Record) (bool, string) { return true, "" }

type okSig struct{}

func (okSig) Verify(Record) bool { return true }

type okRate struct{}

func (okRate) Allow(string) bool { return true }

type okClass struct {
	cls       int
	contentOK bool
}

func (c okClass) Classify(Record) (int, bool, string) {
	if !c.contentOK {
		return c.cls, false, "POCSO content classifier flagged the payload"
	}
	return c.cls, true, ""
}

type okConsent struct{ ok bool }

func (c okConsent) LawfulBasis(Record) (bool, string) {
	if !c.ok {
		return false, "no DPDP lawful basis / consent expired"
	}
	return true, ""
}

type okTenant struct{ t string }

func (c okTenant) Resolve(Record) (string, bool) { return c.t, c.t != "" }

type okPolicy struct{ decision string }

func (c okPolicy) Decide(context.Context, Record) (string, []string) {
	return c.decision, []string{"rule:demo"}
}

type okCrypto struct{ err error }

func (c okCrypto) Encrypt(Record) error { return c.err }

type okStore struct{}

func (okStore) Persist(Record) (string, error) { return "citus-oltp", nil }

type memAudit struct{ events []string }

func (m *memAudit) Record(event, _, _ string) { m.events = append(m.events, event) }

type memAlert struct{ alerts int }

func (m *memAlert) Alert(_, _, _, _ string) { m.alerts++ }

func base() (*Pipeline, *memAudit, *memAlert) {
	a := &memAudit{}
	al := &memAlert{}
	return &Pipeline{
		Schema: okSchema{}, Sig: okSig{}, Rate: okRate{}, Class: okClass{cls: 3, contentOK: true},
		Consent: okConsent{ok: true}, Tenant: okTenant{t: "TN/Chennai"}, Policy: okPolicy{decision: "allow"},
		Crypto: okCrypto{}, Store: okStore{}, Audit: a, Alert: al,
		Sovereign: map[string]bool{"TN-SDC": true, "TN-SDC-DR": true},
	}, a, al
}

func rec() Record {
	return Record{ID: "R1", Source: "APAAR", Channel: "web", Region: "TN-SDC", Payload: map[string]any{"x": 1}}
}

func TestHappyPathAcceptsAndEmits(t *testing.T) {
	p, audit, alert := base()
	res := p.Onboard(context.Background(), rec(), "APAAR Nodal")
	if !res.Accepted || res.Quarantined {
		t.Fatalf("a clean record should be accepted through all 12 steps: %+v", res)
	}
	if len(res.Passed) != 12 || res.Passed[11] != Emit {
		t.Fatalf("all 12 steps should pass ending at emit: %v", res.Passed)
	}
	if res.Store != "citus-oltp" {
		t.Fatalf("persisted store wrong: %q", res.Store)
	}
	if alert.alerts != 0 {
		t.Fatal("a clean record raises no alert")
	}
	if len(audit.events) == 0 || audit.events[len(audit.events)-1] != "onboarding.accept" {
		t.Fatalf("acceptance should be audited: %v", audit.events)
	}
}

func TestSchemaFailureQuarantinesAndAlerts(t *testing.T) {
	p, _, alert := base()
	p.Schema = failSchema{}
	res := p.Onboard(context.Background(), rec(), "APAAR Nodal")
	if res.Accepted || !res.Quarantined || res.FailedStep != Schema {
		t.Fatalf("a schema failure must quarantine at step 1: %+v", res)
	}
	if !res.Alerted || alert.alerts != 1 {
		t.Fatal("quarantine must alert the steward + compliance lead")
	}
}

func TestAuthenticityFailure(t *testing.T) {
	p, _, _ := base()
	p.Sig = failSig{}
	res := p.Onboard(context.Background(), rec(), "s")
	if res.FailedStep != Authenticity {
		t.Fatalf("an unsigned record must fail authenticity: %+v", res)
	}
}

func TestPOCSOContentQuarantined(t *testing.T) {
	p, _, _ := base()
	p.Class = okClass{cls: 3, contentOK: false}
	res := p.Onboard(context.Background(), rec(), "s")
	if res.FailedStep != Classification {
		t.Fatalf("flagged content must quarantine at classification: %+v", res)
	}
}

func TestConsentMissing(t *testing.T) {
	p, _, _ := base()
	p.Consent = okConsent{ok: false}
	res := p.Onboard(context.Background(), rec(), "s")
	if res.FailedStep != Consent {
		t.Fatalf("a missing lawful basis must quarantine at consent: %+v", res)
	}
}

func TestResidencyEgressDenied(t *testing.T) {
	p, _, _ := base()
	p.Class = okClass{cls: 1, contentOK: true} // class-1 PII
	r := rec()
	r.Region = "AWS-Mumbai" // outside TN sovereignty
	res := p.Onboard(context.Background(), r, "s")
	if res.FailedStep != Residency {
		t.Fatalf("Class-1 PII outside TN must be denied at residency: %+v", res)
	}
}

func TestTenantUnresolved(t *testing.T) {
	p, _, _ := base()
	p.Tenant = okTenant{t: ""}
	res := p.Onboard(context.Background(), rec(), "s")
	if res.FailedStep != TenantResolve {
		t.Fatalf("an unresolvable tenant must quarantine: %+v", res)
	}
}

func TestPolicyDenyQuarantines(t *testing.T) {
	p, _, _ := base()
	p.Policy = okPolicy{decision: "deny"}
	res := p.Onboard(context.Background(), rec(), "s")
	if res.FailedStep != Policy || res.Accepted {
		t.Fatalf("a policy deny must quarantine at the policy gate: %+v", res)
	}
}

func TestEncryptFailure(t *testing.T) {
	p, _, _ := base()
	p.Crypto = okCrypto{err: errors.New("kms down")}
	res := p.Onboard(context.Background(), rec(), "s")
	if res.FailedStep != Encrypt {
		t.Fatalf("an encryption failure must quarantine: %+v", res)
	}
}

// failing variants
type failSchema struct{}

func (failSchema) Valid(Record) (bool, string) { return false, "missing required field" }

type failSig struct{}

func (failSig) Verify(Record) bool { return false }
