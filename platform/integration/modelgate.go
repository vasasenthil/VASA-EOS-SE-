package integration

import "github.com/vasa-eos-se-tn/platform/evaluation"

// ModelGate is the L8 fairness/drift verdict for continued model serving.
type ModelGate struct {
	PSI             float64
	Drifted         bool
	DisparateImpact float64
	FairnessOK      bool
	ServingAllowed  bool // a model may keep serving only if it has neither drifted nor failed fairness
}

// EvaluateModel grades a served model against a baseline distribution (drift) and a privileged/unprivileged
// outcome split (bias), and decides whether it may keep serving — operationalising policies/ai/{drift,bias}.
func (p *Platform) EvaluateModel(baseline, live []float64, privFav, privTotal, unprivFav, unprivTotal int) (ModelGate, error) {
	psi, err := evaluation.PSI(baseline, live)
	if err != nil {
		return ModelGate{}, err
	}
	bias, err := evaluation.EvaluateBias(privFav, privTotal, unprivFav, unprivTotal)
	if err != nil {
		return ModelGate{}, err
	}
	g := ModelGate{
		PSI:             psi,
		Drifted:         evaluation.HasDrifted(psi),
		DisparateImpact: bias.DisparateImpact,
		FairnessOK:      bias.PassesFourFifths,
	}
	g.ServingAllowed = !g.Drifted && g.FairnessOK
	verdict := "permit"
	if !g.ServingAllowed {
		verdict = "deny"
	}
	p.appendAudit("model-eval", "ai.model.gate", "served-model", verdict, "")
	return g, nil
}
