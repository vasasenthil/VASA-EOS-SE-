package pep

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"os/exec"
)

// OPADecider evaluates the composed decision against the real Rego plane via the `opa` binary
// (`opa eval --data <policyDir> --stdin-input data.vasa.decision`). In production the PDP is OPA running as
// a sidecar/daemon queried over HTTP; this CLI-backed decider exercises the exact same policy bundle and is
// what CI uses to prove the PEP and the Rego corpus agree. Fail-closed is handled by the PEP wrapper.
type OPADecider struct {
	BinPath   string // path to the opa binary (default: "opa" on PATH)
	PolicyDir string // directory containing the Rego corpus (the repo's policies/)
	Query     string // decision document to evaluate (default: data.vasa.decision)
}

// NewOPADecider builds a decider over a policy directory. binPath "" defaults to "opa" on PATH.
func NewOPADecider(binPath, policyDir string) *OPADecider {
	if binPath == "" {
		binPath = "opa"
	}
	return &OPADecider{BinPath: binPath, PolicyDir: policyDir, Query: "data.vasa.decision"}
}

// opaEvalResult is the subset of `opa eval --format json` output we read.
type opaEvalResult struct {
	Result []struct {
		Expressions []struct {
			Value map[string]any `json:"value"`
		} `json:"expressions"`
	} `json:"result"`
}

// Evaluate runs the policy plane and returns the composed effect and governing rule objects.
func (d *OPADecider) Evaluate(ctx context.Context, input map[string]any) (Effect, []map[string]any, error) {
	inJSON, err := json.Marshal(input)
	if err != nil {
		return "", nil, fmt.Errorf("marshal input: %w", err)
	}
	query := d.Query
	if query == "" {
		query = "data.vasa.decision"
	}
	cmd := exec.CommandContext(ctx, d.BinPath, "eval", "--format", "json", "--data", d.PolicyDir, "--stdin-input", query)
	cmd.Stdin = bytes.NewReader(inJSON)
	var stdout, stderr bytes.Buffer
	cmd.Stdout, cmd.Stderr = &stdout, &stderr
	if err := cmd.Run(); err != nil {
		return "", nil, fmt.Errorf("opa eval: %w: %s", err, stderr.String())
	}

	var res opaEvalResult
	if err := json.Unmarshal(stdout.Bytes(), &res); err != nil {
		return "", nil, fmt.Errorf("parse opa output: %w", err)
	}
	if len(res.Result) == 0 || len(res.Result[0].Expressions) == 0 {
		return "", nil, fmt.Errorf("opa returned no decision (query %q undefined)", query)
	}
	doc := res.Result[0].Expressions[0].Value
	effStr, ok := doc["effect"].(string)
	if !ok {
		return "", nil, fmt.Errorf("decision document missing string effect: %v", doc)
	}

	var governing []map[string]any
	if raw, ok := doc["governing"].([]any); ok {
		for _, g := range raw {
			if m, ok := g.(map[string]any); ok {
				governing = append(governing, m)
			}
		}
	}
	return Effect(effStr), governing, nil
}
