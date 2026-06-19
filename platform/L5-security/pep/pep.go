// Package pep is the VASA-EOS(SE) TN Policy Enforcement Point library (CC-SPEC-001 §8, §17).
//
// Every protected surface — the API gateway (Kong), the service mesh (Istio), application middleware, the
// database RLS gate, object storage (MinIO), and the event bus (Kafka) — is a PEP. A PEP does not decide;
// it builds the canonical decision input and asks the Policy Decision Point (the OPA/Rego plane authored in
// `policies/`, composed by `data.vasa.decision`) for an effect, then enforces it.
//
// Two invariants make this trustworthy:
//   - Single source of truth: the effect is the composed Rego decision (deny-wins → require-approval →
//     permit). No access rule lives in Go business logic (§2.9, ADR-0005).
//   - Fail-closed: if the decision cannot be obtained (decider error, malformed result, timeout), the PEP
//     returns DENY. A zero-trust gate never fails open.
package pep

import (
	"context"
	"errors"
	"fmt"
)

// Effect is the composed policy outcome (mirrors policies/decision.rego).
type Effect string

const (
	Permit          Effect = "permit"
	Deny            Effect = "deny"
	RequireApproval Effect = "require-approval"
)

// Subject is the actor making the request.
type Subject struct {
	ID         string         `json:"id,omitempty"`
	Role       string         `json:"role,omitempty"`
	Tenant     string         `json:"tenant,omitempty"`
	Attributes map[string]any `json:"-"` // flattened into the subject object
}

// Resource is the thing acted upon. Typed fields are convenience; Attributes carries policy-specific keys
// (e.g. age, category, consent, crossBorder) that the regulatory bundles read.
type Resource struct {
	Type           string         `json:"type,omitempty"`
	ID             string         `json:"id,omitempty"`
	Tenant         string         `json:"tenant,omitempty"`
	Classification string         `json:"classification,omitempty"`
	Attributes     map[string]any `json:"-"` // flattened into the resource object
}

// Request is one authorisation question.
type Request struct {
	Subject  Subject
	Action   string
	Resource Resource
	Context  map[string]any
}

// Decision is what the PDP returned and the PEP enforces.
type Decision struct {
	Effect    Effect           // permit | deny | require-approval
	Governing []map[string]any // the rule objects that drove the decision (for the audit record)
	Reasons   []string         // convenience: the "rule" id of each governing object
	Err       error            // set when the PEP failed closed
}

// Allowed reports whether the action may proceed without a human gate.
func (d Decision) Allowed() bool { return d.Effect == Permit }

// NeedsApproval reports whether the action is permitted only after the named reviewer tier approves.
func (d Decision) NeedsApproval() bool { return d.Effect == RequireApproval }

// Decider evaluates the composed policy for a built input document and returns the effect plus the governing
// rule objects. Implementations: OPADecider (the real Rego plane); fakes in tests.
type Decider interface {
	Evaluate(ctx context.Context, input map[string]any) (effect Effect, governing []map[string]any, err error)
}

// PEP is one enforcement point. name identifies which seam (kong|istio|app|db|minio|kafka) for the audit.
type PEP struct {
	name    string
	decider Decider
}

// New constructs a PEP for a named seam over a PDP decider.
func New(name string, d Decider) (*PEP, error) {
	if name == "" {
		return nil, errors.New("pep: name required")
	}
	if d == nil {
		return nil, errors.New("pep: decider required")
	}
	return &PEP{name: name, decider: d}, nil
}

// BuildInput assembles the canonical decision document exactly as policies/decision.rego (and the regulatory
// bundles) read it: {subject:{role,id,tenant,...attrs}, action, resource:{type,id,...attrs}, context}.
func BuildInput(r Request) map[string]any {
	subject := map[string]any{}
	if r.Subject.ID != "" {
		subject["id"] = r.Subject.ID
	}
	if r.Subject.Role != "" {
		subject["role"] = r.Subject.Role
	}
	if r.Subject.Tenant != "" {
		subject["tenant"] = r.Subject.Tenant
	}
	for k, v := range r.Subject.Attributes {
		subject[k] = v
	}

	resource := map[string]any{}
	if r.Resource.Type != "" {
		resource["type"] = r.Resource.Type
	}
	if r.Resource.ID != "" {
		resource["id"] = r.Resource.ID
	}
	if r.Resource.Tenant != "" {
		resource["tenant"] = r.Resource.Tenant
	}
	if r.Resource.Classification != "" {
		resource["classification"] = r.Resource.Classification
	}
	for k, v := range r.Resource.Attributes {
		resource[k] = v
	}

	in := map[string]any{
		"subject":  subject,
		"action":   r.Action,
		"resource": resource,
	}
	if len(r.Context) > 0 {
		in["context"] = r.Context
	}
	return in
}

// Authorize evaluates the composed policy for a request and returns the enforced decision. It is fail-closed:
// any decider error yields a DENY decision carrying the error (never a permit).
func (p *PEP) Authorize(ctx context.Context, r Request) Decision {
	if r.Action == "" {
		return Decision{Effect: Deny, Err: errors.New("pep: action required"), Reasons: []string{"PEP-NO-ACTION"}}
	}
	effect, governing, err := p.decider.Evaluate(ctx, BuildInput(r))
	if err != nil {
		return Decision{Effect: Deny, Err: fmt.Errorf("pep[%s]: fail-closed: %w", p.name, err), Reasons: []string{"PEP-FAIL-CLOSED"}}
	}
	switch effect {
	case Permit, Deny, RequireApproval:
		// recognised effect
	default:
		// an unrecognised effect is treated as deny (fail-closed on a malformed decision)
		return Decision{Effect: Deny, Err: fmt.Errorf("pep[%s]: unknown effect %q", p.name, effect), Reasons: []string{"PEP-UNKNOWN-EFFECT"}}
	}
	reasons := make([]string, 0, len(governing))
	for _, g := range governing {
		if rule, ok := g["rule"].(string); ok {
			reasons = append(reasons, rule)
		}
	}
	return Decision{Effect: effect, Governing: governing, Reasons: reasons}
}

// Name returns the PEP seam identifier.
func (p *PEP) Name() string { return p.name }
