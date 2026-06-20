// Package integration is the VASA-EOS(SE) TN composition root — it MERGES every layer (L1–L12) into one
// platform and runs the end-to-end workflows that prove the layers interlock (CC-SPEC-001 §4, §24).
//
// Each layer was built and tested in isolation; this package wires them together top-to-bottom (a request
// enters at the surface and descends through rate-limiting → the sovereign off-switch → policy enforcement →
// encryption → data residency → audit → human-in-the-loop → verifiable credentials) and bottom-to-top (an
// engine inference rises through guardrails → the knowledge graph → audit → the surface). The result is a
// single, coherent platform rather than a set of islands. Stdlib + the layer modules only.
package integration

import (
	"crypto/ed25519"
	"errors"
	"sync"
	"time"

	"github.com/vasa-eos-se-tn/platform/agentregistry"
	"github.com/vasa-eos-se-tn/platform/audit"
	"github.com/vasa-eos-se-tn/platform/catalogue"
	"github.com/vasa-eos-se-tn/platform/consent"
	"github.com/vasa-eos-se-tn/platform/dr"
	"github.com/vasa-eos-se-tn/platform/hitl"
	"github.com/vasa-eos-se-tn/platform/i18n"
	"github.com/vasa-eos-se-tn/platform/kms"
	"github.com/vasa-eos-se-tn/platform/knowledgegraph"
	"github.com/vasa-eos-se-tn/platform/modelregistry"
	"github.com/vasa-eos-se-tn/platform/notary"
	"github.com/vasa-eos-se-tn/platform/notify"
	"github.com/vasa-eos-se-tn/platform/offswitch"
	"github.com/vasa-eos-se-tn/platform/orchestrator"
	"github.com/vasa-eos-se-tn/platform/pep"
	"github.com/vasa-eos-se-tn/platform/ratelimit"
	"github.com/vasa-eos-se-tn/platform/retrieval"
	"github.com/vasa-eos-se-tn/platform/seed"
	"github.com/vasa-eos-se-tn/platform/serving"
	"github.com/vasa-eos-se-tn/platform/slo"
	"github.com/vasa-eos-se-tn/platform/tokens"
)

// Config configures the composition root.
type Config struct {
	Tenant      string             // the tenant this platform instance serves (e.g. "TN/Chennai")
	IssuerKey   ed25519.PrivateKey // the credential-issuing authority key (HSM-held in production, B-002)
	PerKeyRate  float64            // per-tenant requests/sec (token-bucket refill)
	BurstSize   float64            // per-tenant burst (bucket capacity)
	MaxInFlight int                // global admission ceiling (load shedding beyond this)
	TokenBudget int                // per-user token equity budget per window (default 50000)
}

// Platform is the wired-together platform: one field per layer it composes.
type Platform struct {
	cfg Config

	// L1 sovereign foundation
	Switch *offswitch.OffSwitch
	// L10 surfaces — admission + fairness
	Limiter *ratelimit.Limiter
	Adm     *ratelimit.Admission
	// L5 security
	KMS   *kms.KMS
	Audit *audit.Log
	PEP   *pep.PEP
	// L7 knowledge + verifiability
	Notary *notary.Ledger
	Graph  *knowledgegraph.Graph
	// L9 agents
	Reg          *agentregistry.Registry
	Queue        *hitl.Queue
	Orchestrator *orchestrator.Orchestrator
	// L8 engines
	Tutor  *serving.Gateway
	Tokens *tokens.Meter // token-economics: per-user equity budget + prompt/semantic cache + tier routing
	// L6 platform services
	I18n   *i18n.Catalogue
	Notify *notify.Dispatcher
	Inbox  *notify.InboxSender
	Locale i18n.Locale // default outbound locale (Tamil for TN, English fallback)
	// optional L4 content resolver (DIKSHA-backed) — the tutor cites real content when this is wired.
	Content ContentResolver
	// optional L7 policy-bound hybrid retriever — the tutor grounds answers in cleared content when wired.
	Retriever *retrieval.Retriever
	// operations
	SLO slo.SLO
	DR  *dr.Controller
	// L3 seed (DAT-TN-001) — the application is not productive until the seed is loaded.
	Seed         *seed.Loader
	seedReport   seed.Report
	seedManifest seed.Manifest
	// L3 §F.3 data-lineage / catalogue surface — built over the inventory once the seed is loaded.
	Catalogue *catalogue.Catalogue
	// L8 §G AI-operational governance — the authoritative model-card registry + deploy gate.
	Models *modelregistry.Registry
	// L3 §E consent, lawful-basis & retention register (DPDP).
	Consent *consent.Register

	now func() string

	// bootstrap off-switch holder key. In production the quorum keys are HSM-held and the platform never sees
	// them (B-002); this single bootstrap holder exists only so the reference composition can exercise the
	// off-switch. SwitchHolderID names it.
	swKey        ed25519.PrivateKey
	SwitchHolder string

	mu          sync.Mutex
	good, total int
}

// hitlAudit adapts the L5 audit log to the hitl.AuditSink interface (every queue transition is chained).
type hitlAudit struct {
	log *audit.Log
	now func() string
}

func (h hitlAudit) Record(event, actor, resource, detail string) {
	h.log.Append(audit.Entry{TS: h.now(), Actor: actor, Action: event, Resource: resource, Detail: detail})
}

// New builds and wires the whole platform. decider drives the L5 PEP (real OPA in production / CI, a fake in
// unit tests); gate drives the L8 tutor safety guardrail. Both are injected so the composition root is
// testable with or without the OPA binary present.
func New(cfg Config, decider pep.Decider, gate serving.Gate) (*Platform, error) {
	if cfg.Tenant == "" {
		return nil, errors.New("integration: tenant required")
	}
	if len(cfg.IssuerKey) != ed25519.PrivateKeySize {
		return nil, errors.New("integration: a valid ed25519 issuer key is required")
	}
	if cfg.PerKeyRate <= 0 {
		cfg.PerKeyRate = 100
	}
	if cfg.BurstSize <= 0 {
		cfg.BurstSize = 200
	}
	if cfg.MaxInFlight <= 0 {
		cfg.MaxInFlight = 1024
	}

	now := func() string { return time.Now().UTC().Format(time.RFC3339Nano) }

	// L1: a sovereign off-switch with one bootstrap quorum holder (production keys come from the HSM, B-002).
	pub, priv, err := ed25519.GenerateKey(nil)
	if err != nil {
		return nil, err
	}
	sw, err := offswitch.New(offswitch.Quorum{Holders: map[string]ed25519.PublicKey{"bootstrap": pub}, Threshold: 1})
	if err != nil {
		return nil, err
	}

	limiter, err := ratelimit.NewLimiter(cfg.BurstSize, cfg.PerKeyRate)
	if err != nil {
		return nil, err
	}
	adm, err := ratelimit.NewAdmission(cfg.MaxInFlight)
	if err != nil {
		return nil, err
	}

	km, err := kms.NewRandom()
	if err != nil {
		return nil, err
	}
	auditLog := audit.New()

	pe, err := pep.New("app", decider)
	if err != nil {
		return nil, err
	}

	graph, err := knowledgegraph.New(knowledgegraph.DefaultCurriculum())
	if err != nil {
		return nil, err
	}

	reg := agentregistry.NewRegistry()

	drc, err := dr.New(dr.DefaultTargets())
	if err != nil {
		return nil, err
	}

	// L6: code-first i18n (Tamil first-class, English fallback) + notification dispatch over an inbox.
	cat := i18n.New(i18n.En)
	cat.Load(i18n.En, map[string]string{
		"admission.admitted":  "Application {id} admitted; credential issued.",
		"admission.review":    "Application {id} ({category}) needs your review.",
		"admission.denied":    "Application {id} was denied.",
		"admission.residency": "Application {id} blocked: data residency.",
	})
	cat.Load(i18n.Ta, map[string]string{
		"admission.admitted":  "விண்ணப்பம் {id} சேர்க்கப்பட்டது; சான்றிதழ் வழங்கப்பட்டது.",
		"admission.review":    "விண்ணப்பம் {id} ({category}) உங்கள் பரிசீலனை தேவை.",
		"admission.denied":    "விண்ணப்பம் {id} நிராகரிக்கப்பட்டது.",
		"admission.residency": "விண்ணப்பம் {id} தடுக்கப்பட்டது: தரவு குடியிருப்பு.",
	})
	inbox := notify.NewInboxSender()
	disp, err := notify.New(cat)
	if err != nil {
		return nil, err
	}
	disp.Register(notify.Inbox, inbox)

	p := &Platform{
		cfg:          cfg,
		Switch:       sw,
		Limiter:      limiter,
		Adm:          adm,
		KMS:          km,
		Audit:        auditLog,
		PEP:          pe,
		Notary:       notary.New(),
		Graph:        graph,
		Reg:          reg,
		I18n:         cat,
		Notify:       disp,
		Inbox:        inbox,
		Locale:       i18n.Ta,
		SLO:          slo.Availability(),
		DR:           drc,
		now:          now,
		swKey:        priv,
		SwitchHolder: "bootstrap",
	}

	// L9: the HITL queue executes approved tools by calling back into the platform (e.g. finalise admission
	// → issue a verifiable credential). The orchestrator routes proposals auto vs human.
	q, err := hitl.NewQueue(p, hitlAudit{log: auditLog, now: now})
	if err != nil {
		return nil, err
	}
	p.Queue = q
	orch, err := orchestrator.New(reg, q, hitl.Approver{ID: "system", Scopes: []string{"grievance.route"}})
	if err != nil {
		return nil, err
	}
	p.Orchestrator = orch

	// L3: load the DAT-TN-001 seed inventory at construction — signed by the authority (the issuer key; HSM in
	// production), loaded once idempotently into this production environment. The platform is not productive
	// until the seed is in (DAT-TN-001 §C).
	inv := seed.Inventory()
	man := seed.BuildManifest(inv, "v1", "DSE", cfg.IssuerKey)
	loader := seed.NewLoader(true)
	p.Seed, p.seedManifest = loader, man
	p.seedReport = loader.Load(inv, man)
	// §F.3: assemble the data catalogue over every known asset (production + synthetic dev fixtures), enriched
	// with classification, steward, SLAs and the just-loaded lineage.
	allSeeds := append(append([]seed.Item(nil), inv...), seed.SyntheticInventory()...)
	p.Catalogue = catalogue.Build(allSeeds, loader.Lineage)

	// §G: the AI-operational model registry. The in-production deterministic safety classifier is taken through
	// the full gate (red-team → deploy-request → human approval → deployed); the GPU-served models are
	// registered but remain un-deployed, awaiting their B-011 substrate + bias/red-team evidence (honest).
	p.Models = bootstrapModels(now)

	// §E: the DPDP consent / lawful-basis / retention register, seeded with the platform's standing processing
	// purposes (enrolment, attendance, assessment, scheme DBT, AI tutoring) and their retention rules.
	p.Consent = bootstrapConsent()

	// L8: the tutor gateway serves the deterministic oracle baseline behind the safety gate (the GPU-served
	// model swaps in at B-011 with no change here). The token meter grants each user an equity budget and a
	// prompt/semantic cache in front of it.
	p.Tutor = serving.New(serving.OracleBackend{}, serving.OracleBackend{}, gate)
	budget := cfg.TokenBudget
	if budget <= 0 {
		budget = 50000
	}
	p.Tokens = tokens.New(budget)

	return p, nil
}

// Disable engages the sovereign off-switch (M-of-N quorum) using the bootstrap holder, disabling the
// platform. Production uses HSM-held quorum keys; this reference path uses the single bootstrap holder.
func (p *Platform) Disable(requestID string) (bool, error) {
	req := offswitch.Request{ID: requestID, Action: offswitch.Engage, Target: "platform", CreatedAt: p.now()}
	return p.Switch.Submit(req, offswitch.Approval{HolderID: p.SwitchHolder, Signature: ed25519.Sign(p.swKey, req.CanonicalBytes())})
}

// Enable disengages the off-switch, re-enabling the platform.
func (p *Platform) Enable(requestID string) (bool, error) {
	req := offswitch.Request{ID: requestID, Action: offswitch.Disengage, Target: "platform", CreatedAt: p.now()}
	return p.Switch.Submit(req, offswitch.Approval{HolderID: p.SwitchHolder, Signature: ed25519.Sign(p.swKey, req.CanonicalBytes())})
}

// recordOutcome updates the SLO counters (used by every workflow).
func (p *Platform) recordOutcome(ok bool) {
	p.mu.Lock()
	defer p.mu.Unlock()
	p.total++
	if ok {
		p.good++
	}
}

// Health is a cross-layer health snapshot: SLO budget status + whether the platform is disabled.
type Health struct {
	Disabled    bool
	SLO         slo.Status
	TotalServed int
}

// Health reports the platform's current health (operations layer over the live SLO counters).
func (p *Platform) Health() (Health, error) {
	p.mu.Lock()
	good, total := p.good, p.total
	p.mu.Unlock()
	h := Health{Disabled: p.Switch.Engaged(), TotalServed: total}
	if total == 0 {
		return h, nil
	}
	st, err := p.SLO.Assess(good, total)
	if err != nil {
		return h, err
	}
	h.SLO = st
	return h, nil
}
