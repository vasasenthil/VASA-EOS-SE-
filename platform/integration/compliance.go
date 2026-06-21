package integration

import (
	"context"
	"sort"
	"strings"

	"github.com/vasa-eos-se-tn/platform/engines"
	"github.com/vasa-eos-se-tn/platform/hitl"
)

// complianceRule pairs a reasoning rule with the statute it discharges, so a derived finding can cite its
// governing clause.
type complianceRule struct {
	rule    engines.Rule
	statute string
}

// complianceRules is the regulatory rule base: each rule fires a `violation.*` finding when a school's facts
// indicate non-compliance, and cites the governing clause (RTE 2009 / RPwD 2016 / DPDP 2023 / POCSO 2012).
func complianceRules() []complianceRule {
	v := func(key string) engines.Fact { return engines.Fact{Key: key, Value: "true"} }
	return []complianceRule{
		{engines.Rule{When: map[string]string{"ews_quota_met": "no"}, Then: v("violation.rte.quota"), Because: "RTE Act 2009 §12(1)(c) — 25% EWS/DG quota not met"}, "RTE Act 2009 §12"},
		{engines.Rule{When: map[string]string{"ptr_compliant": "no"}, Then: v("violation.rte.ptr"), Because: "RTE Act 2009 Schedule — pupil-teacher ratio norm breached"}, "RTE Act 2009 Schedule"},
		{engines.Rule{When: map[string]string{"detention_practiced": "yes"}, Then: v("violation.rte.detention"), Because: "RTE Act 2009 §16 — no-detention policy breached"}, "RTE Act 2009 §16"},
		{engines.Rule{When: map[string]string{"accessible_infra": "no"}, Then: v("violation.rpwd.accessibility"), Because: "RPwD Act 2016 §16 — accessible infrastructure absent"}, "RPwD Act 2016 §16"},
		{engines.Rule{When: map[string]string{"consent_recorded": "no"}, Then: v("violation.dpdp.consent"), Because: "DPDP Act 2023 §6 — processing without a recorded lawful basis"}, "DPDP Act 2023 §6"},
		{engines.Rule{When: map[string]string{"child_safety_policy": "no"}, Then: v("violation.pocso.safety"), Because: "POCSO Act 2012 — mandatory child-safety policy absent"}, "POCSO Act 2012"},
	}
}

// ComplianceRequest is a school's compliance fact base to check.
type ComplianceRequest struct {
	School string            `json:"school"` // UDISE
	Facts  map[string]string `json:"facts"`
}

// ComplianceFinding is one derived non-compliance finding with its governing statute.
type ComplianceFinding struct {
	Key     string `json:"key"`     // e.g. violation.rte.quota
	Statute string `json:"statute"` // governing clause
	Detail  string `json:"detail"`  // the rule's rationale
}

// ComplianceOutcome is the result of a school compliance check. Findings are HIGH-STAKES and never auto-acted:
// a compliance officer must sign off (HITL) — the agent advises, the human is accountable.
type ComplianceOutcome struct {
	School          string              `json:"school"`
	Findings        []ComplianceFinding `json:"findings"`
	Clean           bool                `json:"clean"`
	RequiresSignoff bool                `json:"requires_signoff"`
	RequestID       string              `json:"request_id,omitempty"`
	AuditSeq        uint64              `json:"audit_seq"`
}

// CheckCompliance derives RTE/RPwD/DPDP/POCSO findings from a school's facts (L8 reasoning via the L9
// Compliance agent) and, when there are findings, routes them to a compliance officer for sign-off (HITL). A
// clean school records no findings and needs no sign-off.
func (p *Platform) CheckCompliance(ctx context.Context, req ComplianceRequest) ComplianceOutcome {
	facts := make([]engines.Fact, 0, len(req.Facts))
	for k, val := range req.Facts {
		facts = append(facts, engines.Fact{Key: k, Value: val})
	}
	rules := complianceRules()
	statuteFor := map[string]complianceRule{}
	plain := make([]engines.Rule, len(rules))
	for i, cr := range rules {
		plain[i] = cr.rule
		statuteFor[cr.rule.Then.Key] = cr
	}

	out := ComplianceOutcome{School: req.School}
	for _, d := range engines.Reason(facts, plain) {
		if !strings.HasPrefix(d.Fact.Key, "violation.") {
			continue
		}
		cr := statuteFor[d.Fact.Key]
		out.Findings = append(out.Findings, ComplianceFinding{Key: d.Fact.Key, Statute: cr.statute, Detail: d.Because})
	}
	sort.Slice(out.Findings, func(i, j int) bool { return out.Findings[i].Key < out.Findings[j].Key })

	if len(out.Findings) == 0 {
		out.Clean = true
		p.appendAudit("system", "compliance.check", req.School, "clean", "no findings")
		out.AuditSeq = uint64(p.Audit.Len())
		return out
	}
	out.RequiresSignoff = true
	keys := make([]string, len(out.Findings))
	for i, f := range out.Findings {
		keys[i] = f.Statute
	}
	summary := strings.Join(keys, "; ")
	if r, err := p.Queue.Enqueue("compliance", "compliance.signoff",
		map[string]any{"school": req.School, "summary": summary}, "compliance.sign"); err == nil {
		out.RequestID = r.ID
	}
	p.appendAudit("system", "compliance.check", req.School, "findings", summary)
	out.AuditSeq = uint64(p.Audit.Len())
	return out
}

// SignoffCompliance is the compliance officer's sign-off on a school's findings (HITL). Approving records the
// sign-off; the officer must hold compliance.sign.
func (p *Platform) SignoffCompliance(ctx context.Context, requestID string, approve bool, officer string) (hitl.Request, error) {
	return p.Queue.Decide(ctx, requestID, approve, hitl.Approver{ID: officer, Scopes: []string{"compliance.sign"}})
}
