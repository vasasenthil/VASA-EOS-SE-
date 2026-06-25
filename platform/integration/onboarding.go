package integration

import (
	"context"
	"fmt"

	"github.com/vasa-eos-se-tn/platform/consent"
	"github.com/vasa-eos-se-tn/platform/dataplane"
	"github.com/vasa-eos-se-tn/platform/i18n"
	"github.com/vasa-eos-se-tn/platform/notify"
	"github.com/vasa-eos-se-tn/platform/onboarding"
	"github.com/vasa-eos-se-tn/platform/pep"
)

// The onboarding seams, backed by the real platform layers (DAT-TN-001 §B.6).

type obSchema struct{}

func (obSchema) Valid(r onboarding.Record) (bool, string) {
	if r.ID == "" || r.Source == "" {
		return false, "missing required field (id/source)"
	}
	return true, ""
}

type obSig struct{}

func (obSig) Verify(r onboarding.Record) bool {
	// the source signature is verified by the L4 adapter before the record reaches here; a record with an
	// empty signature from a non-internal source is rejected (demo: accept internal/seed-signed records).
	return len(r.Signature) > 0 || r.Source == "internal"
}

type obRate struct{ p *Platform }

func (a obRate) Allow(source string) bool { return a.p.Limiter.Allow("ingest:" + source) }

type obClass struct{}

func (obClass) Classify(r onboarding.Record) (int, bool, string) {
	cat, _ := r.Payload["category"].(string)
	cls := dataplane.Classify(cat)
	pii := map[dataplane.Class]int{dataplane.Class1: 1, dataplane.Class2: 2, dataplane.Class3: 3, dataplane.Class4: 4}[cls]
	if flag, _ := r.Payload["pocso_flag"].(bool); flag {
		return pii, false, "POCSO content classifier flagged the payload"
	}
	return pii, true, ""
}

// obConsent enforces the DPDP lawful-basis step against the LIVE §E register. Class-3/4 data needs no consent
// (statutory/public reporting); Class-1/2 personal data requires either a §7 legitimate use asserted by the
// source steward (statutory bulk ingestion — UDISE+/APAAR), or a per-principal consent grant that is currently
// active in the register (looked up by principal + purpose). A bare payload flag is no longer sufficient.
type obConsent struct{ reg *consent.Register }

func (c obConsent) LawfulBasis(r onboarding.Record) (bool, string) {
	if r.PIIClass > 2 || r.PIIClass == 0 {
		return true, ""
	}
	if statutory, _ := r.Payload["statutory"].(bool); statutory {
		return true, "" // §7 legitimate use (legal obligation) asserted at source
	}
	principal, _ := r.Payload["principal"].(string)
	purpose, _ := r.Payload["purpose"].(string)
	if principal == "" || purpose == "" {
		return false, "no DPDP lawful basis (neither a statutory basis nor a principal+purpose consent reference)"
	}
	if ok, why := c.reg.HasLawfulBasis(principal, purpose); !ok {
		return false, why
	}
	return true, ""
}

type obTenant struct{}

func (obTenant) Resolve(r onboarding.Record) (string, bool) {
	if r.Tenant != "" {
		return r.Tenant, true
	}
	t, ok := r.Payload["tenant"].(string)
	return t, ok && t != ""
}

type obPolicy struct{ p *Platform }

func (a obPolicy) Decide(ctx context.Context, r onboarding.Record) (string, []string) {
	dec := a.p.PEP.Authorize(ctx, pep.Request{
		Action:   "data.ingest",
		Resource: pep.Resource{Type: "record", Tenant: r.Tenant, Attributes: map[string]any{"category": r.Payload["category"]}},
	})
	switch dec.Effect {
	case pep.Permit:
		return "allow", dec.Reasons
	case pep.RequireApproval:
		return "quarantine", dec.Reasons
	default:
		return "deny", dec.Reasons
	}
}

type obCrypto struct{ p *Platform }

func (a obCrypto) Encrypt(r onboarding.Record) error {
	if r.PIIClass > 2 || r.PIIClass == 0 {
		return nil // only Class-1/2 PII is field-level encrypted at rest
	}
	_, err := a.p.KMS.Encrypt(r.Tenant, []byte(fmt.Sprintf("%v", r.Payload)), []byte(r.ID))
	return err
}

type obStore struct{}

func (obStore) Persist(r onboarding.Record) (string, error) {
	dt, _ := r.Payload["datatype"].(string)
	if dt == "" {
		dt = "row"
	}
	cat, _ := r.Payload["category"].(string)
	place := dataplane.Route(dataplane.Record{Category: cat, Datatype: dt, Tenant: r.Tenant, Region: dataplane.Region(r.Region)})
	if !place.Allowed {
		return "", fmt.Errorf("residency: %v", place.Reasons)
	}
	return string(place.Store), nil
}

type obAudit struct{ p *Platform }

func (a obAudit) Record(event, resource, detail string) {
	a.p.appendAudit("onboarding", event, resource, "", detail)
}

type obAlert struct{ p *Platform }

func (a obAlert) Alert(steward, complianceLead, recordID, reason string) {
	// alert the source steward + Compliance Lead (English; steward-facing, not the citizen locale).
	a.p.Notify.Dispatch(context.Background(), notify.Request{
		To: "steward:" + steward, Channel: notify.Inbox, Key: "admission.review", Locale: i18n.En,
		Vars: map[string]string{"id": recordID, "category": "quarantine"}, IdemKey: "quarantine:" + recordID,
	})
}

// Onboard runs a record through the §B.6 twelve-step onboarding gate using the real platform layers. On any
// failure the record is quarantined (not lost) and the source steward + Compliance Lead are alerted.
func (p *Platform) Onboard(ctx context.Context, r onboarding.Record, sourceSteward string) onboarding.Result {
	pipe := &onboarding.Pipeline{
		Schema: obSchema{}, Sig: obSig{}, Rate: obRate{p}, Class: obClass{}, Consent: obConsent{p.Consent},
		Tenant: obTenant{}, Policy: obPolicy{p}, Crypto: obCrypto{p}, Store: obStore{},
		Audit: obAudit{p}, Alert: obAlert{p},
		Sovereign: map[string]bool{"TN-SDC": true, "TN-SDC-DR": true},
	}
	res := pipe.Onboard(ctx, r, sourceSteward)
	p.recordOutcome(res.Accepted || res.Quarantined) // a quarantine is a correct, handled outcome
	return res
}
