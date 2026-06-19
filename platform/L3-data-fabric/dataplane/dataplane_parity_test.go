package dataplane

import (
	"bytes"
	"encoding/json"
	"os"
	"os/exec"
	"path/filepath"
	"testing"
)

// This test guarantees the Go data-plane and the Rego policy plane agree (§2.9: rules authored once). It
// drives a category/region matrix through both and fails on any divergence. Skips when opa is unavailable.

func findOPA() string {
	if b := os.Getenv("OPA_BIN"); b != "" {
		return b
	}
	if p, err := exec.LookPath("opa"); err == nil {
		return p
	}
	if _, err := os.Stat("/tmp/gobin/opa"); err == nil {
		return "/tmp/gobin/opa"
	}
	return ""
}

func policyDir(t *testing.T) string {
	t.Helper()
	d, err := filepath.Abs(filepath.Join("..", "..", "..", "policies"))
	if err != nil {
		t.Fatal(err)
	}
	if _, err := os.Stat(filepath.Join(d, "data", "classification.rego")); err != nil {
		t.Skipf("policy corpus not found: %v", err)
	}
	return d
}

// opaEval runs `opa eval` for a query with a given input, returning the single expression value.
func opaEval(t *testing.T, bin, dir, query string, input any) any {
	t.Helper()
	inJSON, _ := json.Marshal(input)
	cmd := exec.Command(bin, "eval", "--format", "json", "--data", dir, "--stdin-input", query)
	cmd.Stdin = bytes.NewReader(inJSON)
	var out, errb bytes.Buffer
	cmd.Stdout, cmd.Stderr = &out, &errb
	if err := cmd.Run(); err != nil {
		t.Fatalf("opa eval %q: %v: %s", query, err, errb.String())
	}
	var res struct {
		Result []struct {
			Expressions []struct {
				Value any `json:"value"`
			} `json:"expressions"`
		} `json:"result"`
	}
	if err := json.Unmarshal(out.Bytes(), &res); err != nil {
		t.Fatalf("parse opa output: %v", err)
	}
	if len(res.Result) == 0 || len(res.Result[0].Expressions) == 0 {
		return nil // undefined
	}
	return res.Result[0].Expressions[0].Value
}

var categories = []string{"aadhaar", "biometric", "financial", "apaar", "health", "caste", "marks", "disability", "public", "aggregate", "suppressed", "name", "address"}
var regions = []Region{TNSDC, TNSDCDR, "AWS-Mumbai", "edge-pop-7"}

func TestParity_Classification(t *testing.T) {
	bin := findOPA()
	if bin == "" {
		t.Skip("opa unavailable; parity test runs in CI")
	}
	dir := policyDir(t)
	for _, cat := range categories {
		want := opaEval(t, bin, dir, "data.vasa.data.classification.class", map[string]any{"field": map[string]any{"category": cat}})
		got := string(Classify(cat))
		if want != got {
			t.Errorf("classification drift for %q: Go=%q OPA=%v", cat, got, want)
		}
	}
}

func TestParity_Residency(t *testing.T) {
	bin := findOPA()
	if bin == "" {
		t.Skip("opa unavailable; parity test runs in CI")
	}
	dir := policyDir(t)
	for _, cat := range categories {
		for _, region := range regions {
			input := map[string]any{
				"field":    map[string]any{"category": cat},
				"resource": map[string]any{"region": string(region)},
			}
			denySet := opaEval(t, bin, dir, "data.vasa.data.residency.deny", input)
			opaDenied := false
			if arr, ok := denySet.([]any); ok && len(arr) > 0 {
				opaDenied = true
			}
			goDenied := !Route(Record{Category: cat, Datatype: "row", Region: region}).Allowed
			if opaDenied != goDenied {
				t.Errorf("residency drift for %q@%q: Go denied=%v OPA denied=%v", cat, region, goDenied, opaDenied)
			}
		}
	}
}
