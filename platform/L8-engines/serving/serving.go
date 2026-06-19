// Package serving is the L8 inference gateway (CC-SPEC-001 §5, §10.7, §17.6).
//
// All engine/agent inference flows through this gateway, which sits in front of the model-serving backends
// (vLLM/Triton on the GPU fleet, BLOCKERS B-011). Around every call it enforces the non-negotiables:
//
//	IN  — PII is redacted from the prompt before it reaches any model; the prompt's safety signals are
//	      adjudicated by the AI-safety policy gate; an unsafe/injection prompt is refused (fail-closed).
//	CALL— the backend call is wrapped in the resilience core (circuit breaker + bounded retry) so a slow or
//	      failing model degrades gracefully and can fall back to the deterministic oracle baseline.
//	OUT — the generated text is re-inspected and adjudicated by the same gate; unsafe output is refused.
//
// The Backend is a seam: in production it is a vLLM/Triton client; here OracleBackend is a deterministic
// baseline so the whole gateway is testable without a GPU. Engines operate under human authority — the
// gateway never takes an autonomous action, it returns text (or a refusal) for a human/agent to use.
package serving

import (
	"context"
	"errors"
	"fmt"
	"math/rand"
	"time"

	"github.com/vasa-eos-se-tn/platform/guardrails"
	"github.com/vasa-eos-se-tn/platform/resilience"
)

// Backend is a model-serving backend (vLLM/Triton in production; OracleBackend for the deterministic path).
type Backend interface {
	Generate(ctx context.Context, prompt string) (string, error)
}

// Gate adjudicates safety signals against the policy plane (guardrails.SafetyGate satisfies this).
type Gate interface {
	Evaluate(ctx context.Context, sig guardrails.Signals, c guardrails.Context) (guardrails.Verdict, error)
}

// OracleBackend is the deterministic baseline engine: it never calls a model, returning an explainable,
// reproducible response. It is the fallback when GPU serving is unavailable and the oracle for evaluation.
type OracleBackend struct{}

// Generate returns a deterministic, grounded acknowledgement of the (already PII-redacted) prompt.
func (OracleBackend) Generate(_ context.Context, prompt string) (string, error) {
	if prompt == "" {
		return "", errors.New("oracle: empty prompt")
	}
	return "[oracle:baseline] Acknowledged request: " + prompt, nil
}

// Request is one inference request.
type Request struct {
	Prompt         string
	Minor          bool // the end user is a minor (POCSO age-appropriate gate applies)
	AgeAppropriate bool // the upstream classifier deemed the topic age-appropriate
}

// Response is the gateway result. Refused=true means a guardrail blocked the request/response.
type Response struct {
	Text        string
	Refused     bool
	Reasons     []string             // governing rule ids when refused
	PIIRedacted []guardrails.PIIKind // PII kinds stripped from the prompt before serving
	UsedOracle  bool                 // true if the deterministic baseline produced the text
}

// Gateway wires a backend, a fallback oracle, the safety gate and the resilience core together.
type Gateway struct {
	backend  Backend
	fallback Backend
	gate     Gate
	scorer   guardrails.Scorer
	breaker  *resilience.Breaker
	retry    resilience.RetryPolicy
	sleep    func(time.Duration)
	rnd      *rand.Rand
}

// New builds a gateway. If fallback is non-nil, a backend failure (breaker open / retries exhausted) falls
// back to it (the oracle) instead of erroring.
func New(backend, fallback Backend, gate Gate) *Gateway {
	return &Gateway{
		backend:  backend,
		fallback: fallback,
		gate:     gate,
		scorer:   guardrails.NewKeywordScorer(),
		breaker:  resilience.NewBreaker(resilience.BreakerConfig{FailThreshold: 3, OpenTimeout: 20 * time.Second, SuccessThreshold: 1}),
		retry:    resilience.RetryPolicy{MaxAttempts: 3, BaseDelay: 5 * time.Millisecond, MaxDelay: 50 * time.Millisecond},
		sleep:    time.Sleep,
		rnd:      rand.New(rand.NewSource(time.Now().UnixNano())),
	}
}

// SetSleep overrides the backoff sleep (tests inject a no-op).
func (g *Gateway) SetSleep(f func(time.Duration)) { g.sleep = f }

// Breaker exposes the breaker for health surfaces.
func (g *Gateway) Breaker() *resilience.Breaker { return g.breaker }

func (g *Gateway) inspectAndGate(ctx context.Context, text string, minor, ageOK bool) (guardrails.Verdict, guardrails.Signals, error) {
	sig := guardrails.Inspect(text, g.scorer)
	v, err := g.gate.Evaluate(ctx, sig, guardrails.Context{Minor: minor, AgeAppropriate: ageOK})
	return v, sig, err
}

// Generate runs the full guarded inference path.
func (g *Gateway) Generate(ctx context.Context, req Request) (Response, error) {
	// IN: redact PII, then adjudicate the (redacted) prompt.
	redacted, kinds := guardrails.Redact(req.Prompt)
	v, _, err := g.inspectAndGate(ctx, redacted, req.Minor, req.AgeAppropriate)
	if err != nil {
		return Response{Refused: true, Reasons: []string{"AI-GATE-FAIL-CLOSED"}, PIIRedacted: kinds}, nil
	}
	if !v.Allowed {
		return Response{Refused: true, Reasons: v.Reasons, PIIRedacted: kinds}, nil
	}

	// CALL: serve through the resilience core, falling back to the oracle on sustained failure.
	out, usedOracle, err := g.serve(ctx, redacted)
	if err != nil {
		return Response{}, fmt.Errorf("serving: %w", err)
	}

	// OUT: adjudicate the generated text.
	ov, _, oerr := g.inspectAndGate(ctx, out, req.Minor, req.AgeAppropriate)
	if oerr != nil {
		return Response{Refused: true, Reasons: []string{"AI-GATE-FAIL-CLOSED"}, PIIRedacted: kinds, UsedOracle: usedOracle}, nil
	}
	if !ov.Allowed {
		return Response{Refused: true, Reasons: ov.Reasons, PIIRedacted: kinds, UsedOracle: usedOracle}, nil
	}
	return Response{Text: out, PIIRedacted: kinds, UsedOracle: usedOracle}, nil
}

// serve calls the primary backend through breaker+retry; on failure it falls back to the oracle if present.
func (g *Gateway) serve(ctx context.Context, prompt string) (string, bool, error) {
	var out string
	err := resilience.Retry(ctx, g.retry, g.sleep, g.rnd, func() error {
		return g.breaker.Do(func() error {
			s, e := g.backend.Generate(ctx, prompt)
			if e != nil {
				return e
			}
			out = s
			return nil
		})
	})
	if err == nil {
		return out, false, nil
	}
	if g.fallback != nil {
		s, fe := g.fallback.Generate(ctx, prompt)
		if fe != nil {
			return "", false, fe
		}
		return s, true, nil
	}
	return "", false, err
}
