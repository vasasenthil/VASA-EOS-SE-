// Package modelregistry is the DAT-TN-001 §G AI-operational governance registry: the authoritative record of
// every model the platform may run, and the lifecycle gate that makes the §F.2 "no model in production without
// a signed card" SLA enforceable. Each entry carries an evaluation.ModelCard (intended use + bias + drift +
// signed attestation), red-team evidence, and a state machine — registered → pending-approval → deployed →
// retired — where the transition into production requires a passing deploy gate, red-team evidence, AND a
// named human approver (HITL / continuous human authority, CC-SPEC-001 §17, §20). Drift past threshold on a
// live model trips an automatic rollback to blocked (canary discipline). Deterministic; injectable clock.
package modelregistry

import (
	"errors"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/vasa-eos-se-tn/platform/evaluation"
)

// State is a model's lifecycle position.
type State string

const (
	Registered      State = "registered"       // card on file, not yet requested for deploy
	PendingApproval State = "pending-approval" // passed the gate + red-teamed, awaiting a human approver
	Deployed        State = "deployed"         // approved by a human, serving in production
	Rejected        State = "rejected"         // a human declined the deploy
	Retired         State = "retired"          // withdrawn from production
	Blocked         State = "blocked"          // fails the deploy gate (bias/drift/unsigned/no red-team)
)

// Errors returned by the registry.
var (
	ErrNotFound      = errors.New("modelregistry: model not found")
	ErrNotDeployable = errors.New("modelregistry: card does not pass the deploy gate")
	ErrNoRedTeam     = errors.New("modelregistry: a red-team attestation is required before deploy")
	ErrState         = errors.New("modelregistry: illegal state transition")
)

// Event is one entry in a model's immutable governance history.
type Event struct {
	At    string `json:"at"`
	State State  `json:"state"`
	Actor string `json:"actor"`
	Note  string `json:"note,omitempty"`
}

// Entry is a registered model with its card, lifecycle state, red-team evidence and history.
type Entry struct {
	Name     string               `json:"name"`
	Version  string               `json:"version"`
	Card     evaluation.ModelCard `json:"card"`
	State    State                `json:"state"`
	Approver string               `json:"approver,omitempty"` // the human who approved production (HITL)
	RedTeam  []string             `json:"red_team,omitempty"` // red-team finding/attestation ids
	Reasons  []string             `json:"reasons,omitempty"`  // gate-failure reasons when blocked
	History  []Event              `json:"history,omitempty"`
}

// Registry is the in-memory authoritative model register (durable store swaps in behind the same surface).
type Registry struct {
	mu      sync.Mutex
	entries map[string]*Entry
	now     func() string
}

// New builds a registry. now defaults to UTC RFC3339Nano when nil.
func New(now func() string) *Registry {
	if now == nil {
		now = func() string { return time.Now().UTC().Format(time.RFC3339Nano) }
	}
	return &Registry{entries: map[string]*Entry{}, now: now}
}

func key(name, version string) string { return name + "@" + version }

// record appends a history event (caller holds the lock).
func (e *Entry) record(now func() string, actor, note string) {
	e.History = append(e.History, Event{At: now(), State: e.State, Actor: actor, Note: note})
}

// cardOK evaluates the card-level gate (bias + drift + signed attestation), setting Reasons. This is what
// registration checks — a card that fails it is Blocked. Red-team evidence is a separate deploy prerequisite.
func (e *Entry) cardOK() bool {
	ok, reasons := e.Card.Deployable()
	e.Reasons = reasons
	return ok
}

// gate evaluates the full deploy gate: the card-level gate AND red-team evidence on file. Used at the deploy
// request and at the moment of human approval.
func (e *Entry) gate() bool {
	ok := e.cardOK()
	if len(e.RedTeam) == 0 {
		ok = false
		e.Reasons = append(e.Reasons, "no red-team attestation on file")
	}
	return ok
}

// Register files (or re-files) a model card. The entry lands in Registered if the card clears the card-level
// gate (bias/drift/signed), else Blocked with the failure reasons. Re-registering resets the entry.
func (r *Registry) Register(card evaluation.ModelCard, by string) Entry {
	r.mu.Lock()
	defer r.mu.Unlock()
	e := &Entry{Name: card.Name, Version: card.Version, Card: card, RedTeam: nil}
	if e.cardOK() {
		e.State = Registered
	} else {
		e.State = Blocked
	}
	e.record(r.now, by, "card registered")
	r.entries[key(card.Name, card.Version)] = e
	return *e
}

// AddRedTeam attaches a red-team finding/attestation to a model and re-grades it (a model blocked only at the
// card level stays blocked; one merely awaiting red-team is now deploy-eligible).
func (r *Registry) AddRedTeam(name, version, finding, by string) (Entry, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	e, ok := r.entries[key(name, version)]
	if !ok {
		return Entry{}, ErrNotFound
	}
	e.RedTeam = append(e.RedTeam, finding)
	if e.State == Blocked && e.cardOK() {
		e.State = Registered
	} else {
		e.cardOK() // refresh reasons
	}
	e.record(r.now, by, "red-team attestation: "+finding)
	return *e, nil
}

// RequestDeploy moves a deployable, red-teamed model to pending-approval (awaiting a human).
func (r *Registry) RequestDeploy(name, version, by string) (Entry, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	e, ok := r.entries[key(name, version)]
	if !ok {
		return Entry{}, ErrNotFound
	}
	if e.State != Registered {
		return *e, ErrState
	}
	if !e.gate() {
		e.State = Blocked
		e.record(r.now, by, "deploy request rejected by gate")
		if len(e.RedTeam) == 0 {
			return *e, ErrNoRedTeam
		}
		return *e, ErrNotDeployable
	}
	e.State = PendingApproval
	e.record(r.now, by, "deploy requested")
	return *e, nil
}

// Approve is the human authority step: a named approver promotes a pending model into production. The gate is
// re-checked at the moment of approval so nothing slips in stale.
func (r *Registry) Approve(name, version, approver string) (Entry, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	e, ok := r.entries[key(name, version)]
	if !ok {
		return Entry{}, ErrNotFound
	}
	if e.State != PendingApproval {
		return *e, ErrState
	}
	if strings.TrimSpace(approver) == "" {
		return *e, ErrState
	}
	if !e.gate() {
		e.State = Blocked
		e.record(r.now, approver, "approval blocked: gate failed at approval time")
		return *e, ErrNotDeployable
	}
	e.State = Deployed
	e.Approver = approver
	e.record(r.now, approver, "approved for production")
	return *e, nil
}

// Reject records a human declining a pending deploy.
func (r *Registry) Reject(name, version, by, reason string) (Entry, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	e, ok := r.entries[key(name, version)]
	if !ok {
		return Entry{}, ErrNotFound
	}
	if e.State != PendingApproval {
		return *e, ErrState
	}
	e.State = Rejected
	e.record(r.now, by, "deploy rejected: "+reason)
	return *e, nil
}

// Retire withdraws a deployed model from production.
func (r *Registry) Retire(name, version, by string) (Entry, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	e, ok := r.entries[key(name, version)]
	if !ok {
		return Entry{}, ErrNotFound
	}
	if e.State != Deployed {
		return *e, ErrState
	}
	e.State = Retired
	e.record(r.now, by, "retired from production")
	return *e, nil
}

// RefreshDrift updates a model's live drift (PSI). If a deployed model drifts past threshold it is tripped
// back to blocked — the canary-rollback discipline — so production never silently serves a drifted model.
func (r *Registry) RefreshDrift(name, version string, psi float64, by string) (Entry, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	e, ok := r.entries[key(name, version)]
	if !ok {
		return Entry{}, ErrNotFound
	}
	e.Card.PSI = psi
	if e.State == Deployed && evaluation.HasDrifted(psi) {
		e.State = Blocked
		e.gate()
		e.record(r.now, by, "drift past threshold — automatic rollback")
	} else {
		e.gate()
		e.record(r.now, by, "drift refreshed")
	}
	return *e, nil
}

// Get returns a single entry.
func (r *Registry) Get(name, version string) (Entry, bool) {
	r.mu.Lock()
	defer r.mu.Unlock()
	e, ok := r.entries[key(name, version)]
	if !ok {
		return Entry{}, false
	}
	return *e, true
}

// IsServable reports whether a model is cleared to serve (a deployed, human-approved card on file). This is the
// enforcement point the serving path consults — fail-closed: an unregistered model is never servable.
func (r *Registry) IsServable(name, version string) bool {
	r.mu.Lock()
	defer r.mu.Unlock()
	e, ok := r.entries[key(name, version)]
	return ok && e.State == Deployed
}

// Entries returns every registered model, sorted by name@version.
func (r *Registry) Entries() []Entry {
	r.mu.Lock()
	defer r.mu.Unlock()
	out := make([]Entry, 0, len(r.entries))
	for _, e := range r.entries {
		out = append(out, *e)
	}
	sort.Slice(out, func(i, j int) bool {
		return key(out[i].Name, out[i].Version) < key(out[j].Name, out[j].Version)
	})
	return out
}

// ProductionModels returns the deployed (production-serving) models.
func (r *Registry) ProductionModels() []Entry {
	var out []Entry
	for _, e := range r.Entries() {
		if e.State == Deployed {
			out = append(out, e)
		}
	}
	return out
}

// Summary is the §G governance roll-up for a dashboard.
type Summary struct {
	Total          int           `json:"total"`
	ByState        map[State]int `json:"by_state"`
	Deployed       int           `json:"deployed"`
	Blocked        int           `json:"blocked"`
	RedTeamedShare float64       `json:"red_teamed_share"` // fraction of models with red-team evidence
	CardCoverage   float64       `json:"card_coverage"`    // deployed-with-signed-card / deployed (the §F.2 SLA)
	UnsignedInProd []string      `json:"unsigned_in_prod"` // any deployed model lacking a signed attestation (must be empty)
}

// Summary computes the §G roll-up, including the model-card coverage that feeds the §F.2 SLA. Card coverage is
// the share of production models carrying a signed attestation; it is 1.0 (compliant) when none is unsigned.
func (r *Registry) Summary() Summary {
	entries := r.Entries()
	s := Summary{Total: len(entries), ByState: map[State]int{}}
	redTeamed := 0
	for _, e := range entries {
		s.ByState[e.State]++
		if len(e.RedTeam) > 0 {
			redTeamed++
		}
		if e.State == Deployed {
			s.Deployed++
			if strings.TrimSpace(e.Card.AttestationBy) == "" {
				s.UnsignedInProd = append(s.UnsignedInProd, key(e.Name, e.Version))
			}
		}
		if e.State == Blocked {
			s.Blocked++
		}
	}
	if len(entries) > 0 {
		s.RedTeamedShare = float64(redTeamed) / float64(len(entries))
	}
	if s.Deployed == 0 {
		s.CardCoverage = 1 // vacuously compliant — nothing in production
	} else {
		s.CardCoverage = float64(s.Deployed-len(s.UnsignedInProd)) / float64(s.Deployed)
	}
	return s
}
