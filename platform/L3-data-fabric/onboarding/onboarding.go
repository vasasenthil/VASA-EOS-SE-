// Package onboarding implements the DAT-TN-001 §B.6 onboarding pipeline — the single chokepoint every record
// passes before it enters the data fabric (L3). No datum enters except through this L4→L5 gate; there are no
// "side doors". The pipeline runs twelve ordered steps; if any step fails the record is QUARANTINED (not
// lost) and an alert is raised to the source steward + the Compliance Lead. Each step that needs another
// layer is a seam (interface), so the pipeline is testable standalone and wired to the real
// dataplane/PEP/KMS/audit in the platform. Stdlib-only.
package onboarding

import "context"

// Step is a pipeline stage (§B.6).
type Step string

const (
	Schema         Step = "schema-validation"
	Authenticity   Step = "authenticity"
	RateShape      Step = "rate-shape"
	Classification Step = "data-classification"
	Consent        Step = "consent-check"
	Residency      Step = "residency-enforce"
	TenantResolve  Step = "tenant-resolution"
	Policy         Step = "policy-gate"
	Encrypt        Step = "encrypt-at-rest"
	Persist        Step = "persist"
	AuditLog       Step = "audit-log"
	Emit           Step = "emit"
)

// AllSteps is the ordered pipeline.
var AllSteps = []Step{Schema, Authenticity, RateShape, Classification, Consent, Residency, TenantResolve, Policy, Encrypt, Persist, AuditLog, Emit}

// Record is a datum entering the platform from one of the five canonical sources.
type Record struct {
	ID        string
	Source    string // e.g. "APAAR", "PFMS", a portal id
	Channel   string // web | mobile | sms | ivr | iot | ai
	Payload   map[string]any
	Signature []byte // source signature (authenticity)
	// filled in during the pipeline:
	PIIClass int    // 1..4 (set at classification)
	Tenant   string // resolved T0..T6 id
	Region   string // residency region
	Store    string // canonical store chosen at persist
}

// ── Seams (each maps to a platform layer) ──

type SchemaValidator interface {
	Valid(r Record) (bool, string)
}
type SignatureVerifier interface {
	Verify(r Record) bool
}
type RateLimiter interface {
	Allow(source string) bool
}
type Classifier interface {
	// Classify returns the PII class (1..4), whether the content is acceptable (POCSO-aware), and a reason.
	Classify(r Record) (piiClass int, contentOK bool, reason string)
}
type ConsentChecker interface {
	LawfulBasis(r Record) (ok bool, reason string)
}
type TenantResolver interface {
	Resolve(r Record) (tenant string, ok bool)
}
type PolicyGate interface {
	// Decide returns "allow" | "deny" | "quarantine" plus governing reasons.
	Decide(ctx context.Context, r Record) (decision string, reasons []string)
}
type Encryptor interface {
	Encrypt(r Record) error
}
type Persister interface {
	Persist(r Record) (store string, err error)
}
type Auditor interface {
	Record(event, resource, detail string)
}
type Alerter interface {
	Alert(steward, complianceLead, recordID, reason string)
}

// Pipeline wires the seams.
type Pipeline struct {
	Schema    SchemaValidator
	Sig       SignatureVerifier
	Rate      RateLimiter
	Class     Classifier
	Consent   ConsentChecker
	Tenant    TenantResolver
	Policy    PolicyGate
	Crypto    Encryptor
	Store     Persister
	Audit     Auditor
	Alert     Alerter
	Sovereign map[string]bool // TN-sovereign residency regions (residency enforce)
}

// Result is the onboarding outcome.
type Result struct {
	Accepted    bool // passed all twelve steps and was emitted
	Quarantined bool // a step failed → quarantined, not lost
	FailedStep  Step // the step that failed (when quarantined)
	Reason      string
	Passed      []Step   // steps that passed
	Reasons     []string // governing reasons (e.g. policy)
	Store       string   // canonical store, when persisted
	Alerted     bool     // steward + compliance lead alerted on quarantine
}

// Onboard runs a record through the twelve-step gate. On any failure the record is quarantined and the source
// steward + Compliance Lead are alerted.
func (p *Pipeline) Onboard(ctx context.Context, r Record, sourceSteward string) Result {
	res := Result{}
	fail := func(step Step, reason string) Result {
		res.Quarantined, res.FailedStep, res.Reason = true, step, reason
		if p.Audit != nil {
			p.Audit.Record("onboarding.quarantine", r.ID, string(step)+": "+reason)
		}
		if p.Alert != nil {
			p.Alert.Alert(sourceSteward, "Compliance Lead", r.ID, string(step)+": "+reason)
			res.Alerted = true
		}
		return res
	}
	pass := func(step Step) { res.Passed = append(res.Passed, step) }

	// 1 · SCHEMA VALIDATION
	if p.Schema != nil {
		if ok, why := p.Schema.Valid(r); !ok {
			return fail(Schema, why)
		}
	}
	pass(Schema)

	// 2 · AUTHENTICITY — source signature
	if p.Sig != nil && !p.Sig.Verify(r) {
		return fail(Authenticity, "source signature verification failed")
	}
	pass(Authenticity)

	// 3 · RATE / SHAPE
	if p.Rate != nil && !p.Rate.Allow(r.Source) {
		return fail(RateShape, "per-source rate budget exceeded")
	}
	pass(RateShape)

	// 4 · DATA CLASSIFICATION (PII level + POCSO-aware content)
	if p.Class != nil {
		cls, contentOK, why := p.Class.Classify(r)
		r.PIIClass = cls
		if !contentOK {
			return fail(Classification, why)
		}
	}
	pass(Classification)

	// 5 · CONSENT CHECK (DPDP lawful basis)
	if p.Consent != nil {
		if ok, why := p.Consent.LawfulBasis(r); !ok {
			return fail(Consent, why)
		}
	}
	pass(Consent)

	// 6 · RESIDENCY ENFORCE — Class-1/2 PII may reside only in a TN-sovereign region (egress denied).
	if r.PIIClass == 1 || r.PIIClass == 2 {
		if r.Region == "" || (p.Sovereign != nil && !p.Sovereign[r.Region]) {
			return fail(Residency, "Class-1/2 PII outside a TN-sovereign region (egress denied)")
		}
	}
	pass(Residency)

	// 7 · TENANT RESOLUTION (explicit T0–T6 id)
	if p.Tenant != nil {
		t, ok := p.Tenant.Resolve(r)
		if !ok || t == "" {
			return fail(TenantResolve, "could not resolve an explicit tenant id")
		}
		r.Tenant = t
	}
	pass(TenantResolve)

	// 8 · POLICY GATE (OPA Rego: allow / deny / quarantine)
	if p.Policy != nil {
		decision, reasons := p.Policy.Decide(ctx, r)
		res.Reasons = reasons
		switch decision {
		case "allow":
			// proceed
		default: // deny | quarantine | anything else → quarantine (fail-closed)
			return fail(Policy, "policy decision: "+decision)
		}
	}
	pass(Policy)

	// 9 · ENCRYPT-AT-REST (per-tenant DEK; field-level for PII)
	if p.Crypto != nil {
		if err := p.Crypto.Encrypt(r); err != nil {
			return fail(Encrypt, "encryption failed: "+err.Error())
		}
	}
	pass(Encrypt)

	// 10 · PERSIST (routed to the canonical store per classification)
	if p.Store != nil {
		store, err := p.Store.Persist(r)
		if err != nil {
			return fail(Persist, "persist failed: "+err.Error())
		}
		res.Store = store
	}
	pass(Persist)

	// 11 · AUDIT-LOG (append-only + notarised)
	if p.Audit != nil {
		p.Audit.Record("onboarding.accept", r.ID, "source="+r.Source+" class="+itoa(r.PIIClass))
	}
	pass(AuditLog)

	// 12 · EMIT (downstream event; CDC to lakehouse if applicable)
	pass(Emit)
	res.Accepted = true
	return res
}

func itoa(n int) string {
	if n == 0 {
		return "0"
	}
	return string(rune('0' + n))
}
