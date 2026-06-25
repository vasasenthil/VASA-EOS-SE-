package main

import (
	"context"
	"os"
	"path/filepath"

	"github.com/vasa-eos-se-tn/platform/guardrails"
	"github.com/vasa-eos-se-tn/platform/pep"
	"github.com/vasa-eos-se-tn/platform/serving"
)

// chooseStack returns the PEP decider + tutor safety gate. If a real OPA binary and the policy corpus are
// available (VASA_OPA_BIN / VASA_POLICY_DIR, or the in-repo defaults), it wires the LIVE Rego plane; otherwise
// it falls back to in-process deciders that mirror the policies, so the server runs anywhere.
func chooseStack() (pep.Decider, serving.Gate, string) {
	bin := os.Getenv("VASA_OPA_BIN")
	if bin == "" {
		if _, err := os.Stat("/tmp/gobin/opa"); err == nil {
			bin = "/tmp/gobin/opa"
		}
	}
	dir := os.Getenv("VASA_POLICY_DIR")
	if dir == "" {
		// best-effort: the repo's policies/ relative to this binary's working dir
		if abs, err := filepath.Abs("policies"); err == nil {
			if _, err := os.Stat(filepath.Join(abs, "decision.rego")); err == nil {
				dir = abs
			}
		}
	}
	if bin != "" && dir != "" {
		if _, err := os.Stat(filepath.Join(dir, "decision.rego")); err == nil {
			return pep.NewOPADecider(bin, dir), guardrails.NewSafetyGate(bin, dir), "live-opa(" + dir + ")"
		}
	}
	return inProcDecider{}, inProcGate{}, "in-process(policies mirrored)"
}

// inProcDecider mirrors the composed admission policy for the demo when OPA is not present.
type inProcDecider struct{}

func (inProcDecider) Evaluate(_ context.Context, in map[string]any) (pep.Effect, []map[string]any, error) {
	action, _ := in["action"].(string)
	res, _ := in["resource"].(map[string]any)
	subj, _ := in["subject"].(map[string]any)
	role, _ := subj["role"].(string)
	switch action {
	case "admission.reject":
		cat, _ := res["category"].(string)
		quotaFull, _ := res["quotaFull"].(bool)
		if (cat == "EWS" || cat == "DG") && !quotaFull {
			return pep.RequireApproval, []map[string]any{{"rule": "RTE-EWS-QUOTA"}}, nil
		}
		return pep.Permit, nil, nil
	case "admission.admit":
		if role == "HEAD_TEACHER" {
			return pep.Permit, nil, nil
		}
		return pep.Deny, []map[string]any{{"rule": "RBAC-DENY"}}, nil
	default:
		return pep.Permit, nil, nil
	}
}

// inProcGate mirrors policies/ai/safety.rego for the demo when OPA is not present.
type inProcGate struct{}

func (inProcGate) Evaluate(_ context.Context, sig guardrails.Signals, c guardrails.Context) (guardrails.Verdict, error) {
	var reasons []string
	if c.Minor && !c.AgeAppropriate {
		reasons = append(reasons, "AI-AGE-INAPPROPRIATE")
	}
	if sig.PromptInjection {
		reasons = append(reasons, "AI-PROMPT-INJECTION")
	}
	if sig.SafetyScore < 0.5 {
		reasons = append(reasons, "AI-UNSAFE")
	}
	if len(reasons) > 0 {
		return guardrails.Verdict{Allowed: false, Reasons: reasons}, nil
	}
	return guardrails.Verdict{Allowed: true}, nil
}
