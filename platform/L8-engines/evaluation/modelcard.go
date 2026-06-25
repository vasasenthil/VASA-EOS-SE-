package evaluation

import (
	"fmt"
	"strings"
)

// ModelCard is a declarative model-card artifact (CC-SPEC-001 §17.6, §20; the "Spec Engineering · model cards"
// discipline). It binds a served model's identity, intended use, and its measured fairness + drift posture
// into a signed, reviewable record — the gate `policies/ai/bias.rego` checks before a model.deploy.
type ModelCard struct {
	Name          string
	Version       string
	IntendedUse   string
	Owner         string // the G-tier owner accountable for the model
	Bias          BiasReport
	PSI           float64 // current drift vs baseline
	AttestationBy string  // who signed the fairness attestation (empty = unsigned)
}

// Deployable reports whether the card clears the deploy gate: fairness passes the four-fifths rule, drift is
// under threshold, and a fairness attestation is signed.
func (c ModelCard) Deployable() (bool, []string) {
	var fail []string
	if !c.Bias.PassesFourFifths {
		fail = append(fail, "fairness: disparate impact below the four-fifths rule")
	}
	if HasDrifted(c.PSI) {
		fail = append(fail, "drift: PSI above threshold (canary rollback required)")
	}
	if strings.TrimSpace(c.AttestationBy) == "" {
		fail = append(fail, "no signed bias/fairness attestation")
	}
	return len(fail) == 0, fail
}

// Markdown renders the card as a human-reviewable model card.
func (c ModelCard) Markdown() string {
	deployable, reasons := c.Deployable()
	var b strings.Builder
	fmt.Fprintf(&b, "# Model Card — %s %s\n\n", c.Name, c.Version)
	fmt.Fprintf(&b, "- **Owner:** %s\n", c.Owner)
	fmt.Fprintf(&b, "- **Intended use:** %s\n", c.IntendedUse)
	fmt.Fprintf(&b, "- **Fairness attestation:** %s\n\n", orNone(c.AttestationBy))
	b.WriteString("## Fairness\n")
	fmt.Fprintf(&b, "- Privileged selection rate: %.3f\n", c.Bias.PrivilegedRate)
	fmt.Fprintf(&b, "- Unprivileged selection rate: %.3f\n", c.Bias.UnprivilegedRate)
	fmt.Fprintf(&b, "- Disparate impact: %.3f (four-fifths rule: %s)\n", c.Bias.DisparateImpact, pass(c.Bias.PassesFourFifths))
	fmt.Fprintf(&b, "- Demographic-parity difference: %.3f\n\n", c.Bias.ParityDifference)
	b.WriteString("## Drift\n")
	fmt.Fprintf(&b, "- PSI vs baseline: %.3f (threshold %.1f: %s)\n\n", c.PSI, DriftThreshold, pass(!HasDrifted(c.PSI)))
	b.WriteString("## Deployment gate\n")
	if deployable {
		b.WriteString("- ✅ Deployable\n")
	} else {
		b.WriteString("- ⛔ Blocked:\n")
		for _, r := range reasons {
			fmt.Fprintf(&b, "  - %s\n", r)
		}
	}
	return b.String()
}

func pass(ok bool) string {
	if ok {
		return "PASS"
	}
	return "FAIL"
}
func orNone(s string) string {
	if strings.TrimSpace(s) == "" {
		return "— (unsigned)"
	}
	return s
}
