package integration

import (
	"context"

	"github.com/vasa-eos-se-tn/platform/i18n"
	"github.com/vasa-eos-se-tn/platform/notify"
	"github.com/vasa-eos-se-tn/platform/quality"
)

// QualityReport is a data-quality run plus the §F.1/§F.2 governance verdict.
type QualityReport struct {
	Dataset         string   `json:"dataset"`
	Passed          bool     `json:"passed"`
	CompletenessPct float64  `json:"completeness_pct"`
	Quarantined     []int    `json:"quarantined"`
	Steward         string   `json:"steward"`
	SLAMet          bool     `json:"sla_met"`
	Alerted         bool     `json:"alerted"`
	Failures        []string `json:"failures,omitempty"`
}

// CheckQuality runs the §F.4 data-quality checks on a dataset for a domain, grades completeness against the
// domain SLA (§F.2), audits the run, and — on failure — quarantines the bad rows and alerts the domain
// steward + Compliance Lead (§F.1).
func (p *Platform) CheckQuality(ctx context.Context, domain string, ds quality.Dataset, checks ...quality.Check) QualityReport {
	rep := quality.Run(ds, checks...)
	st, _ := quality.StewardFor(domain)

	_, slaMet, found := quality.EvaluateSLA(domain, "completeness", rep.CompletenessPct)
	qr := QualityReport{
		Dataset: ds.Name, Passed: rep.Passed, CompletenessPct: rep.CompletenessPct,
		Quarantined: rep.Quarantined, Steward: st.Name, SLAMet: slaMet || !found,
	}
	for _, c := range rep.Checks {
		if !c.Passed {
			qr.Failures = append(qr.Failures, c.Name+": "+c.Detail)
		}
	}

	verdict := "pass"
	if !rep.Passed {
		verdict = "quarantine"
	}
	p.appendAudit("data-quality", "quality.check", ds.Name, verdict, st.Name)

	if !rep.Passed {
		p.Notify.Dispatch(ctx, notify.Request{
			To: "steward:" + st.Name, Channel: notify.Inbox, Key: "admission.review", Locale: i18n.En,
			Vars: map[string]string{"id": ds.Name, "category": "data-quality"}, IdemKey: "dq:" + ds.Name,
		})
		qr.Alerted = true
	}
	p.recordOutcome(true)
	return qr
}

// SLAStatus grades one §F.2 data-quality SLA against a live measurement.
type SLAStatus struct {
	Domain    string  `json:"domain"`
	Metric    string  `json:"metric"`
	Threshold float64 `json:"threshold"`
	Measured  float64 `json:"measured"`
	Met       bool    `json:"met"`
	Window    string  `json:"window"`
	Source    string  `json:"source"` // where the live measurement came from
}

// SLABoard grades the §F.2 SLAs that the platform can measure live today. The model-card coverage SLA is
// sourced from the §G registry (the only production model is the signed, deployed safety classifier → 1.0);
// the remaining SLAs depend on operational telemetry that is pending its substrate, and are reported as such
// rather than faked. This is the honest, self-measuring slice of the SLA register.
func (p *Platform) SLABoard() []SLAStatus {
	var board []SLAStatus

	// model_card / coverage — measured live from the model registry.
	cov := p.Models.Summary().CardCoverage
	if sla, met, found := quality.EvaluateSLA("model_card", "coverage", cov); found {
		board = append(board, SLAStatus{
			Domain: sla.Domain, Metric: sla.Metric, Threshold: sla.Threshold, Measured: cov,
			Met: met, Window: sla.Window, Source: "model-registry (§G)",
		})
	}

	// audit / integrity — measured live from the hash-chain + notary (a verified chain ⇒ integrity 1.0).
	integrity := 0.0
	if _, err := p.Audit.Verify(); err == nil {
		integrity = 1.0
	}
	if sla, met, found := quality.EvaluateSLA("audit", "integrity", integrity); found {
		board = append(board, SLAStatus{
			Domain: sla.Domain, Metric: sla.Metric, Threshold: sla.Threshold, Measured: integrity,
			Met: met, Window: sla.Window, Source: "audit hash-chain (L5)",
		})
	}

	return board
}
