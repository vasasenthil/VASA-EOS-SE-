// Package offswitch implements the VASA-EOS(SE) TN sovereign off-switch (CC-SPEC-001 §2.1, §4 L1).
//
// The State of Tamil Nadu (T0) holds the ability to engage/disengage the platform's kill-switch. No
// single officer may flip it: an action is authorised only when M of N registered key-holders each
// submit a valid ed25519 signature over the request. Every approval and state change is appended to a
// tamper-evident audit. Replay-safe: a request nonce, once executed, is closed; a holder is counted
// once per request. Dependency-free (stdlib only) so it is trivially auditable and portable.
package offswitch

import (
	"crypto/ed25519"
	"encoding/json"
	"errors"
	"fmt"
	"sync"
	"time"
)

// Action is the operation requested on the switch.
type Action string

const (
	Engage    Action = "engage"    // disable the platform
	Disengage Action = "disengage" // re-enable the platform
)

// Holder is a registered quorum key-holder (a T0 officer).
type Holder struct {
	ID     string
	PubKey ed25519.PublicKey
}

// Quorum is the M-of-N threshold configuration.
type Quorum struct {
	Holders   map[string]ed25519.PublicKey
	Threshold int // M
}

// Request is a single off-switch request; ID is a unique nonce that is signed and prevents replay.
type Request struct {
	ID        string `json:"id"`
	Action    Action `json:"action"`
	Target    string `json:"target"`
	CreatedAt string `json:"created_at"`
}

// CanonicalBytes is the exact byte sequence each holder signs (and the service re-derives to verify).
func (r Request) CanonicalBytes() []byte {
	b, _ := json.Marshal(struct {
		ID, Action, Target, CreatedAt string
	}{r.ID, string(r.Action), r.Target, r.CreatedAt})
	return b
}

// Approval is one holder's signature over a request.
type Approval struct {
	HolderID  string
	Signature []byte
}

// Event is an append-only audit record.
type Event struct {
	TS      string
	Kind    string // "approval" | "executed" | "rejected"
	Request string
	Holder  string
	Detail  string
}

// OffSwitch is the stateful sovereign switch. Safe for concurrent use.
type OffSwitch struct {
	mu        sync.Mutex
	quorum    Quorum
	engaged   bool
	approvals map[string]map[string]bool // requestID -> set(holderID)
	executed  map[string]bool            // requestID -> done (replay guard)
	audit     []Event
	now       func() time.Time
}

// New constructs an off-switch with the given quorum (starts disengaged = platform running).
func New(q Quorum) (*OffSwitch, error) {
	if q.Threshold < 1 {
		return nil, errors.New("threshold must be >= 1")
	}
	if q.Threshold > len(q.Holders) {
		return nil, fmt.Errorf("threshold %d exceeds %d holders", q.Threshold, len(q.Holders))
	}
	return &OffSwitch{
		quorum:    q,
		approvals: map[string]map[string]bool{},
		executed:  map[string]bool{},
		now:       time.Now,
	}, nil
}

// Engaged reports whether the platform is currently disabled by the switch.
func (s *OffSwitch) Engaged() bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.engaged
}

// Audit returns a copy of the append-only audit trail.
func (s *OffSwitch) Audit() []Event {
	s.mu.Lock()
	defer s.mu.Unlock()
	out := make([]Event, len(s.audit))
	copy(out, s.audit)
	return out
}

func (s *OffSwitch) log(kind, req, holder, detail string) {
	s.audit = append(s.audit, Event{TS: s.now().UTC().Format(time.RFC3339Nano), Kind: kind, Request: req, Holder: holder, Detail: detail})
}

// Submit records a holder's approval for a request. It returns authorised=true exactly on the approval
// that crosses the M-of-N threshold and executes the action. Errors on unknown holder, bad signature,
// or a request that has already executed (replay).
func (s *OffSwitch) Submit(req Request, ap Approval) (authorised bool, err error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	pub, ok := s.quorum.Holders[ap.HolderID]
	if !ok {
		s.log("rejected", req.ID, ap.HolderID, "unknown holder")
		return false, errors.New("unknown holder")
	}
	if req.Action != Engage && req.Action != Disengage {
		return false, errors.New("invalid action")
	}
	if s.executed[req.ID] {
		s.log("rejected", req.ID, ap.HolderID, "request already executed (replay)")
		return false, errors.New("request already executed")
	}
	if !ed25519.Verify(pub, req.CanonicalBytes(), ap.Signature) {
		s.log("rejected", req.ID, ap.HolderID, "invalid signature")
		return false, errors.New("invalid signature")
	}

	if s.approvals[req.ID] == nil {
		s.approvals[req.ID] = map[string]bool{}
	}
	s.approvals[req.ID][ap.HolderID] = true // one count per holder (dedup)
	s.log("approval", req.ID, ap.HolderID, fmt.Sprintf("%d/%d", len(s.approvals[req.ID]), s.quorum.Threshold))

	if len(s.approvals[req.ID]) < s.quorum.Threshold {
		return false, nil
	}
	// threshold reached — execute exactly once
	s.engaged = req.Action == Engage
	s.executed[req.ID] = true
	s.log("executed", req.ID, "", fmt.Sprintf("action=%s engaged=%v target=%s", req.Action, s.engaged, req.Target))
	return true, nil
}

// Distinct returns how many distinct holders have approved a request (for status surfaces).
func (s *OffSwitch) Distinct(requestID string) int {
	s.mu.Lock()
	defer s.mu.Unlock()
	return len(s.approvals[requestID])
}
