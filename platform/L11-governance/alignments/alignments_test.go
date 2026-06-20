package alignments

import "testing"

func TestAlignmentRegister(t *testing.T) {
	as := Alignments()
	if len(as) < 10 {
		t.Fatalf("GLO-TN-001 names ten+ globally-recognised initiatives, got %d", len(as))
	}
	codes := map[string]bool{}
	for _, a := range as {
		if a.Code == "" || a.Name == "" || a.Commitment == "" || a.Evidence == "" {
			t.Fatalf("alignment incomplete: %+v", a)
		}
		if codes[a.Code] {
			t.Fatalf("duplicate alignment %s", a.Code)
		}
		codes[a.Code] = true
		switch a.Posture {
		case Instrumented, Partial, Pending:
		default:
			t.Fatalf("alignment %s has an invalid posture %q", a.Code, a.Posture)
		}
	}
	// the headline frameworks must be present.
	for _, c := range []string{"SDG4", "OECD-PISA", "GPAI", "UNESCO-AIETHICS", "WB-STARS"} {
		if !codes[c] {
			t.Fatalf("missing headline alignment %s", c)
		}
	}
}

func TestAlignmentSummary(t *testing.T) {
	if a, ok := AlignmentFor("GPAI"); !ok || a.Posture != Instrumented {
		t.Fatalf("GPAI must be instrumented, got %+v ok=%v", a, ok)
	}
	s := Summarise()
	if s.Total < 10 || s.Instrumented == 0 {
		t.Fatalf("summary wrong: %+v", s)
	}
}
