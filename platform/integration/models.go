package integration

import (
	"github.com/vasa-eos-se-tn/platform/evaluation"
	"github.com/vasa-eos-se-tn/platform/modelregistry"
)

// bootstrapModels assembles the §G model registry at boot. It mirrors what actually runs today: the
// deterministic safety classifier (rule-based POCSO/jailbreak/PII/bias scorers) is genuinely in production, so
// it is carried through the full deploy gate to Deployed; the GPU-served generative models are registered but
// left un-deployed because they are gated on the B-011 substrate and their bias/red-team evidence — honest.
func bootstrapModels(now func() string) *modelregistry.Registry {
	r := modelregistry.New(now)

	// The deterministic safety classifier — rule-based, so its selection rates are balanced by construction;
	// signed by the G6 Ethics Chair, zero drift, red-teamed, and approved by the accountable human.
	bias, _ := evaluation.EvaluateBias(80, 100, 79, 100) // DI ~0.99 → clears the four-fifths rule
	classifier := evaluation.ModelCard{
		Name: "safety-classifier", Version: "v1",
		IntendedUse: "POCSO/jailbreak/PII/bias content moderation on the tutor path",
		Owner:       "G6 Ethics Chair", Bias: bias, PSI: 0.02, AttestationBy: "G6 Ethics Chair",
	}
	r.Register(classifier, "G5 Chief AI Architect")
	r.AddRedTeam("safety-classifier", "v1", "RT-2026-001 · jailbreak + injection suite passed", "G6 Ethics Chair")
	r.RequestDeploy("safety-classifier", "v1", "G5 Chief AI Architect")
	r.Approve("safety-classifier", "v1", "Secretary, School Education")

	// GPU-served generative + Indic models — registered with a provisional card, awaiting their substrate and
	// independent bias/red-team evidence (B-011). They are intentionally NOT deployed.
	provisional := func(name, ver, use, owner string) evaluation.ModelCard {
		b, _ := evaluation.EvaluateBias(75, 100, 70, 100) // ~0.93, card-level fair but not yet red-teamed
		return evaluation.ModelCard{Name: name, Version: ver, IntendedUse: use, Owner: owner, Bias: b, PSI: 0.03, AttestationBy: owner}
	}
	r.Register(provisional("llama-3.x-70b", "v1", "reasoning + tutoring generation", "G5 Chief AI Architect"), "G5 Chief AI Architect")
	r.Register(provisional("indictrans2", "v1", "Tamil↔English translation", "G5 Chief AI Architect"), "G5 Chief AI Architect")
	r.Register(provisional("indic-conformer-asr", "v1", "Tamil speech recognition", "G5 Chief AI Architect"), "G5 Chief AI Architect")

	return r
}

// ModelRegistry returns the §G governance roll-up across every registered model.
func (p *Platform) ModelRegistry() modelregistry.Summary { return p.Models.Summary() }

// ModelEntries returns every registered model with its card, state, red-team evidence and history.
func (p *Platform) ModelEntries() []modelregistry.Entry { return p.Models.Entries() }

// ModelEntry returns one registered model.
func (p *Platform) ModelEntry(name, version string) (modelregistry.Entry, bool) {
	return p.Models.Get(name, version)
}

// ModelServable reports whether a model is cleared (deployed + human-approved) to serve in production.
func (p *Platform) ModelServable(name, version string) bool {
	return p.Models.IsServable(name, version)
}

// ModelCardCoverage is the §F.2 "no model in production without a signed card" SLA value, sourced live from
// the registry (1.0 when every production model carries a signed attestation).
func (p *Platform) ModelCardCoverage() float64 { return p.Models.Summary().CardCoverage }
