// Package guardrails is the L8 AI safety guardrail pipeline (CC-SPEC-001 §5, §17.6).
//
// Every engine/agent inference passes through guardrails on the way in and the way out. The pipeline PRODUCES
// the safety signals that the Rego AI-safety policy (policies/ai/safety.rego) then adjudicates: PII present
// in the prompt (redacted before it ever reaches a model), prompt-injection / jailbreak attempts, and a
// safety score from a content classifier. The enforcement decision is the policy's, not Go's
// (safetygate.go) — this package computes the inputs. Deterministic + stdlib-only.
package guardrails

import (
	"regexp"
	"strings"
)

// PIIKind labels a detected personal-data span.
type PIIKind string

const (
	Aadhaar PIIKind = "aadhaar"
	Phone   PIIKind = "phone"
	Email   PIIKind = "email"
	APAAR   PIIKind = "apaar"
)

// Signals are the safety signals computed for a piece of text (the input to policies/ai/safety.rego).
type Signals struct {
	PII             []PIIKind // kinds of PII detected
	PromptInjection bool      // a jailbreak / injection attempt was detected
	SafetyScore     float64   // content-classifier score in [0,1]; lower = less safe
}

var (
	// Aadhaar: 12 digits, optionally grouped 4-4-4. Checked before phone so it wins on 12-digit runs.
	reAadhaar = regexp.MustCompile(`\b\d{4}\s?\d{4}\s?\d{4}\b`)
	rePhone   = regexp.MustCompile(`\b[6-9]\d{9}\b`)
	reEmail   = regexp.MustCompile(`\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b`)
	reAPAAR   = regexp.MustCompile(`\bAPAAR[-:\s]?[A-Z0-9]{6,}\b`)
)

// injectionPhrases are common prompt-injection / jailbreak markers (case-insensitive substring match).
var injectionPhrases = []string{
	"ignore previous instructions",
	"ignore all previous",
	"disregard the above",
	"disregard previous",
	"you are now",
	"system prompt",
	"developer mode",
	"jailbreak",
	"do anything now",
	"reveal your instructions",
	"bypass the rules",
}

// Redact replaces detected PII spans with typed placeholders and returns the redacted text plus the kinds
// found. PII is redacted BEFORE the text is sent to any model (a model never sees raw identifiers).
func Redact(text string) (string, []PIIKind) {
	var kinds []PIIKind
	seen := map[PIIKind]bool{}
	add := func(k PIIKind) {
		if !seen[k] {
			seen[k] = true
			kinds = append(kinds, k)
		}
	}
	out := text
	// order matters: APAAR and email before the bare-digit patterns
	if reAPAAR.MatchString(out) {
		out = reAPAAR.ReplaceAllString(out, "[REDACTED:apaar]")
		add(APAAR)
	}
	if reEmail.MatchString(out) {
		out = reEmail.ReplaceAllString(out, "[REDACTED:email]")
		add(Email)
	}
	if reAadhaar.MatchString(out) {
		out = reAadhaar.ReplaceAllString(out, "[REDACTED:aadhaar]")
		add(Aadhaar)
	}
	if rePhone.MatchString(out) {
		out = rePhone.ReplaceAllString(out, "[REDACTED:phone]")
		add(Phone)
	}
	return out, kinds
}

// DetectInjection reports whether the text contains a prompt-injection / jailbreak marker.
func DetectInjection(text string) bool {
	l := strings.ToLower(text)
	for _, p := range injectionPhrases {
		if strings.Contains(l, p) {
			return true
		}
	}
	return false
}

// Scorer produces a content-safety score in [0,1] (in production, a classifier model). Injected for tests.
type Scorer interface {
	Score(text string) float64
}

// KeywordScorer is a deterministic baseline scorer: it starts at 1.0 and subtracts for unsafe markers, so the
// pipeline is fully testable without a model. The real engine swaps in the served classifier.
type KeywordScorer struct {
	Unsafe []string // lower-case markers that reduce the score
}

// NewKeywordScorer builds a baseline scorer with a default unsafe lexicon.
func NewKeywordScorer() *KeywordScorer {
	return &KeywordScorer{Unsafe: []string{"self-harm", "suicide", "weapon", "explicit", "abuse", "kill yourself"}}
}

// Score returns 1.0 minus 0.5 per distinct unsafe marker present, floored at 0.
func (s *KeywordScorer) Score(text string) float64 {
	l := strings.ToLower(text)
	score := 1.0
	for _, m := range s.Unsafe {
		if strings.Contains(l, m) {
			score -= 0.5
		}
	}
	if score < 0 {
		return 0
	}
	return score
}

// Inspect computes the full signal set for a piece of text using the given scorer.
func Inspect(text string, scorer Scorer) Signals {
	_, kinds := Redact(text)
	return Signals{
		PII:             kinds,
		PromptInjection: DetectInjection(text),
		SafetyScore:     scorer.Score(text),
	}
}
