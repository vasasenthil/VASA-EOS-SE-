// Package consent is the DAT-TN-001 §E consent, lawful-basis & retention register: the DPDP-Act-2023 ledger
// that records, per data principal and purpose, the lawful basis on which their personal data is processed,
// the retention clock that starts when a purpose ends, and the data-principal rights (access §11, erasure §12,
// consent withdrawal §6(4)). It enforces the child-protection rules (§9: verifiable parental consent for a
// minor; no behavioural monitoring of children) and the statutory-hold override on erasure. Every transition
// is appended to an immutable per-grant history. Deterministic; injectable clock.
package consent

import (
	"errors"
	"sort"
	"sync"
	"time"
)

// Basis is a DPDP lawful basis for processing — consent (§6) or a "legitimate use" (§7).
type Basis string

const (
	Consent         Basis = "consent"           // §6 — freely given, specific, withdrawable
	LegalObligation Basis = "legal-obligation"  // §7(b) — compliance with law (e.g. RTE, UDISE+)
	CourtOrder      Basis = "court-order"       // §7(c)
	Employment      Basis = "employment"        // §7(i) — staff/HRMS purposes
	Subsidy         Basis = "subsidy-benefit"   // §7(b)/state benefit — scheme/DBT delivery
	Emergency       Basis = "medical-emergency" // §7(f)
)

// legitimateUse reports whether a basis is a §7 legitimate use (not withdrawable like consent).
func (b Basis) legitimateUse() bool { return b != Consent }

// Purpose is a registered processing purpose with its retention rule and child-protection flags.
type Purpose struct {
	ID              string
	Name            string
	PIIClass        int  // the §E.1 class of data the purpose touches
	RetentionDays   int  // how long data may be kept after the purpose ends
	ChildProhibited bool // DPDP §9(3) — behavioural monitoring / targeted advertising: never for a minor
}

// Status is a grant's lifecycle position.
type Status string

const (
	Active    Status = "active"
	Withdrawn Status = "withdrawn"
	Erased    Status = "erased"
)

// Event is one immutable entry in a grant's history.
type Event struct {
	At     string `json:"at"`
	Action string `json:"action"`
	Actor  string `json:"actor"`
	Note   string `json:"note,omitempty"`
}

// Grant is one principal's lawful-basis record for one purpose.
type Grant struct {
	ID            string    `json:"id"`
	Principal     string    `json:"principal"` // the data principal (student/parent/teacher)
	Minor         bool      `json:"minor"`     // a child (<18) — DPDP §9 protections apply
	Guardian      string    `json:"guardian,omitempty"`
	PurposeID     string    `json:"purpose_id"`
	Basis         Basis     `json:"basis"`
	Status        Status    `json:"status"`
	GrantedAt     string    `json:"granted_at"`
	PurposeEnded  time.Time `json:"-"`                       // zero ⇒ purpose ongoing
	PurposeEndStr string    `json:"purpose_ended,omitempty"` // rendered timestamp
	StatutoryHold bool      `json:"statutory_hold"`          // legal hold preventing erasure
	History       []Event   `json:"history,omitempty"`
}

// Errors.
var (
	ErrUnknownPurpose  = errors.New("consent: unknown purpose")
	ErrUnknownGrant    = errors.New("consent: unknown grant")
	ErrGuardianReqd    = errors.New("consent: verifiable parental consent required for a minor (DPDP §9)")
	ErrChildProhibited = errors.New("consent: purpose is prohibited for a minor (DPDP §9(3))")
	ErrNotConsent      = errors.New("consent: only consent-based grants can be withdrawn")
	ErrStatutoryHold   = errors.New("consent: erasure blocked by a statutory hold")
	ErrAlreadyErased   = errors.New("consent: grant already erased")
)

// Register is the stateful §E ledger.
type Register struct {
	mu       sync.Mutex
	purposes map[string]Purpose
	grants   map[string]*Grant
	now      func() time.Time
}

// New builds a register. now defaults to time.Now (UTC) when nil.
func New(now func() time.Time) *Register {
	if now == nil {
		now = func() time.Time { return time.Now().UTC() }
	}
	return &Register{purposes: map[string]Purpose{}, grants: map[string]*Grant{}, now: now}
}

// RegisterPurpose adds (or replaces) a processing purpose in the catalogue.
func (r *Register) RegisterPurpose(p Purpose) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.purposes[p.ID] = p
}

// Purposes returns the registered purpose catalogue, sorted by id.
func (r *Register) Purposes() []Purpose {
	r.mu.Lock()
	defer r.mu.Unlock()
	out := make([]Purpose, 0, len(r.purposes))
	for _, p := range r.purposes {
		out = append(out, p)
	}
	sort.Slice(out, func(i, j int) bool { return out[i].ID < out[j].ID })
	return out
}

func (r *Register) ts() string { return r.now().UTC().Format(time.RFC3339Nano) }

// Grant records a lawful basis for a principal + purpose. For a minor, a consent basis requires a named
// guardian (verifiable parental consent), and a child-prohibited purpose is refused outright.
func (r *Register) Grant(id, principal, purposeID string, basis Basis, minor bool, guardian string) (Grant, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	p, ok := r.purposes[purposeID]
	if !ok {
		return Grant{}, ErrUnknownPurpose
	}
	if minor && p.ChildProhibited {
		return Grant{}, ErrChildProhibited
	}
	if minor && basis == Consent && guardian == "" {
		return Grant{}, ErrGuardianReqd
	}
	g := &Grant{
		ID: id, Principal: principal, Minor: minor, Guardian: guardian,
		PurposeID: purposeID, Basis: basis, Status: Active, GrantedAt: r.ts(),
	}
	g.History = append(g.History, Event{At: g.GrantedAt, Action: "granted", Actor: principal, Note: string(basis)})
	r.grants[id] = g
	return *g, nil
}

// Withdraw records a data principal withdrawing consent (DPDP §6(4)). Only consent-based grants are
// withdrawable; a §7 legitimate use cannot be. Withdrawal ends the purpose, starting the retention clock.
func (r *Register) Withdraw(id, by string) (Grant, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	g, ok := r.grants[id]
	if !ok {
		return Grant{}, ErrUnknownGrant
	}
	if g.Basis.legitimateUse() {
		return *g, ErrNotConsent
	}
	if g.Status == Erased {
		return *g, ErrAlreadyErased
	}
	g.Status = Withdrawn
	g.PurposeEnded = r.now().UTC()
	g.PurposeEndStr = g.PurposeEnded.Format(time.RFC3339Nano)
	g.History = append(g.History, Event{At: r.ts(), Action: "withdrawn", Actor: by})
	return *g, nil
}

// EndPurpose marks a grant's purpose as fulfilled/ended, starting the retention clock (without withdrawal —
// e.g. a student graduates, a scheme cycle closes).
func (r *Register) EndPurpose(id, by string) (Grant, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	g, ok := r.grants[id]
	if !ok {
		return Grant{}, ErrUnknownGrant
	}
	if g.Status == Erased {
		return *g, ErrAlreadyErased
	}
	g.PurposeEnded = r.now().UTC()
	g.PurposeEndStr = g.PurposeEnded.Format(time.RFC3339Nano)
	g.History = append(g.History, Event{At: r.ts(), Action: "purpose-ended", Actor: by})
	return *g, nil
}

// SetStatutoryHold places or lifts a legal hold that blocks erasure regardless of the retention clock.
func (r *Register) SetStatutoryHold(id string, hold bool, by, reason string) (Grant, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	g, ok := r.grants[id]
	if !ok {
		return Grant{}, ErrUnknownGrant
	}
	g.StatutoryHold = hold
	action := "statutory-hold-lifted"
	if hold {
		action = "statutory-hold-placed"
	}
	g.History = append(g.History, Event{At: r.ts(), Action: action, Actor: by, Note: reason})
	return *g, nil
}

// LawfulToProcess reports whether a grant currently authorises processing, with a reason when it does not.
func (r *Register) LawfulToProcess(id string) (bool, string) {
	r.mu.Lock()
	defer r.mu.Unlock()
	g, ok := r.grants[id]
	if !ok {
		return false, "no lawful basis on file"
	}
	switch g.Status {
	case Withdrawn:
		return false, "consent withdrawn"
	case Erased:
		return false, "data erased"
	}
	return true, ""
}

// erasureDue reports whether a grant is due for erasure now (caller holds the lock).
func (r *Register) erasureDue(g *Grant) bool {
	if g.Status == Erased || g.StatutoryHold || g.PurposeEnded.IsZero() {
		return false
	}
	p, ok := r.purposes[g.PurposeID]
	if !ok {
		return false
	}
	deadline := g.PurposeEnded.Add(time.Duration(p.RetentionDays) * 24 * time.Hour)
	return !r.now().UTC().Before(deadline)
}

// ErasureDue reports whether a grant's retention window has elapsed (purpose ended, retention passed, no hold).
func (r *Register) ErasureDue(id string) bool {
	r.mu.Lock()
	defer r.mu.Unlock()
	g, ok := r.grants[id]
	if !ok {
		return false
	}
	return r.erasureDue(g)
}

// Erase performs erasure. With force=false it erases only when the retention window is due; with force=true it
// honours a data-principal erasure request (DPDP §12) immediately. A statutory hold blocks erasure either way.
func (r *Register) Erase(id, by string, force bool) (Grant, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	g, ok := r.grants[id]
	if !ok {
		return Grant{}, ErrUnknownGrant
	}
	if g.Status == Erased {
		return *g, ErrAlreadyErased
	}
	if g.StatutoryHold {
		g.History = append(g.History, Event{At: r.ts(), Action: "erasure-blocked", Actor: by, Note: "statutory hold"})
		return *g, ErrStatutoryHold
	}
	if !force && !r.erasureDue(g) {
		return *g, errors.New("consent: retention window not yet elapsed")
	}
	g.Status = Erased
	g.History = append(g.History, Event{At: r.ts(), Action: "erased", Actor: by})
	return *g, nil
}

// RunRetention sweeps every grant and erases those whose retention window has elapsed (the DPDP §8(7) storage
// limitation in action). It returns the ids erased and those skipped because a statutory hold applies.
func (r *Register) RunRetention(by string) (erased, heldBack []string) {
	r.mu.Lock()
	defer r.mu.Unlock()
	for _, id := range r.sortedGrantIDs() {
		g := r.grants[id]
		if g.Status == Erased {
			continue
		}
		if r.erasureDue(g) {
			g.Status = Erased
			g.History = append(g.History, Event{At: r.ts(), Action: "erased", Actor: by, Note: "retention sweep"})
			erased = append(erased, id)
		} else if g.StatutoryHold && !g.PurposeEnded.IsZero() {
			heldBack = append(heldBack, id)
		}
	}
	return erased, heldBack
}

// Get returns one grant.
func (r *Register) Get(id string) (Grant, bool) {
	r.mu.Lock()
	defer r.mu.Unlock()
	g, ok := r.grants[id]
	if !ok {
		return Grant{}, false
	}
	return *g, true
}

func (r *Register) sortedGrantIDs() []string {
	ids := make([]string, 0, len(r.grants))
	for id := range r.grants {
		ids = append(ids, id)
	}
	sort.Strings(ids)
	return ids
}

// AccessReport is the DPDP §11 right-to-access answer: every grant held about a principal.
type AccessReport struct {
	Principal string  `json:"principal"`
	Grants    []Grant `json:"grants"`
}

// Access returns the right-to-access report for a data principal.
func (r *Register) Access(principal string) AccessReport {
	r.mu.Lock()
	defer r.mu.Unlock()
	rep := AccessReport{Principal: principal}
	for _, id := range r.sortedGrantIDs() {
		if g := r.grants[id]; g.Principal == principal {
			rep.Grants = append(rep.Grants, *g)
		}
	}
	return rep
}

// Summary is the §E register roll-up for a governance dashboard.
type Summary struct {
	Purposes      int            `json:"purposes"`
	Grants        int            `json:"grants"`
	ByStatus      map[Status]int `json:"by_status"`
	ByBasis       map[Basis]int  `json:"by_basis"`
	Minors        int            `json:"minors"`
	GuardianGiven int            `json:"guardian_consents"`
	StatutoryHeld int            `json:"statutory_holds"`
	ErasureDue    int            `json:"erasure_due"`
}

// Summary computes the §E roll-up.
func (r *Register) Summary() Summary {
	r.mu.Lock()
	defer r.mu.Unlock()
	s := Summary{Purposes: len(r.purposes), Grants: len(r.grants), ByStatus: map[Status]int{}, ByBasis: map[Basis]int{}}
	for _, g := range r.grants {
		s.ByStatus[g.Status]++
		s.ByBasis[g.Basis]++
		if g.Minor {
			s.Minors++
			if g.Guardian != "" {
				s.GuardianGiven++
			}
		}
		if g.StatutoryHold {
			s.StatutoryHeld++
		}
		if r.erasureDue(g) {
			s.ErasureDue++
		}
	}
	return s
}
