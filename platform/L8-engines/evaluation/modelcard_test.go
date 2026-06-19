package evaluation

import (
	"strings"
	"testing"
)

func fairCard(t *testing.T) ModelCard {
	t.Helper()
	bias, err := EvaluateBias(80, 100, 80, 100) // parity → passes four-fifths
	if err != nil {
		t.Fatal(err)
	}
	return ModelCard{
		Name: "tn-tutor", Version: "v1", IntendedUse: "Class 4 fractions tutoring",
		Owner: "G4 Academic Standards", Bias: bias, PSI: 0.05, AttestationBy: "G6 Security & Compliance",
	}
}

func TestDeployableCard(t *testing.T) {
	ok, reasons := fairCard(t).Deployable()
	if !ok {
		t.Fatalf("a fair, low-drift, attested model should deploy: %v", reasons)
	}
}

func TestBlockedOnBias(t *testing.T) {
	c := fairCard(t)
	c.Bias, _ = EvaluateBias(80, 100, 40, 100) // DI 0.5 → fails four-fifths
	ok, reasons := c.Deployable()
	if ok || !anyContains(reasons, "four-fifths") {
		t.Fatalf("a biased model must be blocked: ok=%v reasons=%v", ok, reasons)
	}
}

func TestBlockedOnDrift(t *testing.T) {
	c := fairCard(t)
	c.PSI = 0.3 // > 0.2 threshold
	ok, reasons := c.Deployable()
	if ok || !anyContains(reasons, "drift") {
		t.Fatalf("a drifted model must be blocked: ok=%v reasons=%v", ok, reasons)
	}
}

func TestBlockedOnUnsignedAttestation(t *testing.T) {
	c := fairCard(t)
	c.AttestationBy = ""
	ok, reasons := c.Deployable()
	if ok || !anyContains(reasons, "attestation") {
		t.Fatalf("an unattested model must be blocked: ok=%v reasons=%v", ok, reasons)
	}
}

func TestMarkdownRenders(t *testing.T) {
	md := fairCard(t).Markdown()
	for _, want := range []string{"# Model Card — tn-tutor v1", "Disparate impact", "PSI vs baseline", "Deployable"} {
		if !strings.Contains(md, want) {
			t.Fatalf("model card markdown missing %q", want)
		}
	}
}

func anyContains(xs []string, sub string) bool {
	for _, x := range xs {
		if strings.Contains(x, sub) {
			return true
		}
	}
	return false
}
