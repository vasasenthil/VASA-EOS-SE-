package guardrails

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"os/exec"
)

// SafetyGate enforces policies/ai/safety.rego over computed signals. The DECISION is the policy's: the gate
// builds the policy input ({minor, classification.age_appropriate, signals{...}}) and evaluates
// data.vasa.ai.safety.deny. Fail-closed: if the policy cannot be evaluated, generation is refused.
type SafetyGate struct {
	BinPath   string // opa binary ("opa" on PATH by default)
	PolicyDir string // the repo's policies/ directory
}

// NewSafetyGate builds a gate over a policy directory.
func NewSafetyGate(binPath, policyDir string) *SafetyGate {
	if binPath == "" {
		binPath = "opa"
	}
	return &SafetyGate{BinPath: binPath, PolicyDir: policyDir}
}

// Verdict is the gate outcome.
type Verdict struct {
	Allowed bool
	Reasons []string // governing rule ids when denied
}

// Context carries the non-signal facts the policy needs.
type Context struct {
	Minor          bool
	AgeAppropriate bool
}

// Evaluate adjudicates signals + context against the AI-safety policy. Fail-closed on any evaluation error.
func (g *SafetyGate) Evaluate(ctx context.Context, sig Signals, c Context) (Verdict, error) {
	input := map[string]any{
		"minor":          c.Minor,
		"classification": map[string]any{"age_appropriate": c.AgeAppropriate},
		"signals": map[string]any{
			"prompt_injection": sig.PromptInjection,
			"safety_score":     sig.SafetyScore,
		},
	}
	inJSON, _ := json.Marshal(input)
	cmd := exec.CommandContext(ctx, g.BinPath, "eval", "--format", "json", "--data", g.PolicyDir, "--stdin-input", "data.vasa.ai.safety.deny")
	cmd.Stdin = bytes.NewReader(inJSON)
	var out, errb bytes.Buffer
	cmd.Stdout, cmd.Stderr = &out, &errb
	if err := cmd.Run(); err != nil {
		return Verdict{Allowed: false, Reasons: []string{"AI-GATE-FAIL-CLOSED"}}, fmt.Errorf("opa eval: %w: %s", err, errb.String())
	}
	var res struct {
		Result []struct {
			Expressions []struct {
				Value []map[string]any `json:"value"`
			} `json:"expressions"`
		} `json:"result"`
	}
	if err := json.Unmarshal(out.Bytes(), &res); err != nil {
		return Verdict{Allowed: false, Reasons: []string{"AI-GATE-FAIL-CLOSED"}}, fmt.Errorf("parse opa output: %w", err)
	}
	var denials []map[string]any
	if len(res.Result) > 0 && len(res.Result[0].Expressions) > 0 {
		denials = res.Result[0].Expressions[0].Value
	}
	if len(denials) == 0 {
		return Verdict{Allowed: true}, nil
	}
	reasons := make([]string, 0, len(denials))
	for _, d := range denials {
		if r, ok := d["rule"].(string); ok {
			reasons = append(reasons, r)
		}
	}
	return Verdict{Allowed: false, Reasons: reasons}, nil
}
