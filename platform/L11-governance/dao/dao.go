// Package dao is the L11 Education-DAO layer (Synthesis Brief: "Education DAOs — on-chain accountable
// SMC/parent/teacher councils; non-transferable soulbound badges; voting on Snapshot+Besu; ADVISORY to
// statutory authority"). It models a School Management Committee (SMC) as a council whose members hold
// NON-TRANSFERABLE soulbound badges, who deliberate proposals by one-member-one-vote with quorum + threshold.
// The defining rule — and the honest governance line — is that a passed proposal is ADVISORY ONLY: it
// recommends, but the accountable statutory authority (head teacher / BEO) must ratify it. The Besu/Snapshot
// substrate is gated (B-020); this is the sovereign council-governance logic that runs on it. Deterministic.
package dao

import (
	"errors"
	"sort"
)

// Badge is a NON-TRANSFERABLE (soulbound) council-membership credential. It is bound to its holder for life of
// membership: it can be issued or revoked by the council authority, but never transferred.
type Badge struct {
	Holder    string `json:"holder"`
	Role      string `json:"role"` // parent | teacher | head-teacher | community
	Soulbound bool   `json:"soulbound"`
	IssuedAt  string `json:"issued_at"`
}

// Errors.
var (
	ErrSoulbound = errors.New("dao: soulbound badge is non-transferable")
	ErrNotMember = errors.New("dao: only a badge-holding member may vote")
	ErrDuplicate = errors.New("dao: member has already voted")
	ErrClosed    = errors.New("dao: proposal is closed")
	ErrNotFound  = errors.New("dao: not found")
)

// Council is an SMC (School Management Committee) — a set of soulbound members governing one school.
type Council struct {
	ID          string
	Name        string
	SchoolUDISE string
	members     map[string]Badge
	now         func() string
}

// NewCouncil builds a council. now defaults to a fixed stamp when nil (deterministic).
func NewCouncil(id, name, udise string, now func() string) *Council {
	if now == nil {
		now = func() string { return "t0" }
	}
	return &Council{ID: id, Name: name, SchoolUDISE: udise, members: map[string]Badge{}, now: now}
}

// IssueBadge admits a member with a soulbound badge (the council authority issues; idempotent per holder).
func (c *Council) IssueBadge(holder, role string) Badge {
	b := Badge{Holder: holder, Role: role, Soulbound: true, IssuedAt: c.now()}
	c.members[holder] = b
	return b
}

// RevokeBadge removes a member.
func (c *Council) RevokeBadge(holder string) bool {
	if _, ok := c.members[holder]; !ok {
		return false
	}
	delete(c.members, holder)
	return true
}

// TransferBadge always fails: a soulbound badge cannot move between holders.
func (c *Council) TransferBadge(from, to string) error { return ErrSoulbound }

// IsMember reports council membership.
func (c *Council) IsMember(holder string) bool { _, ok := c.members[holder]; return ok }

// Members returns the council roster, sorted by holder.
func (c *Council) Members() []Badge {
	out := make([]Badge, 0, len(c.members))
	for _, b := range c.members {
		out = append(out, b)
	}
	sort.Slice(out, func(i, j int) bool { return out[i].Holder < out[j].Holder })
	return out
}

// Size is the council membership count.
func (c *Council) Size() int { return len(c.members) }

// Vote is a ballot.
type Vote string

const (
	Yes     Vote = "yes"
	No      Vote = "no"
	Abstain Vote = "abstain"
)

// Status is a proposal's lifecycle.
type Status string

const (
	Open     Status = "open"
	Passed   Status = "passed"   // met quorum + threshold (advisory — awaits ratification)
	Rejected Status = "rejected" // met quorum, below threshold
	NoQuorum Status = "no-quorum"
)

// Proposal is a council motion under one-member-one-vote.
type Proposal struct {
	ID      string
	Title   string
	council *Council
	votes   map[string]Vote
	closed  bool
}

// Propose opens a motion in the council.
func (c *Council) Propose(id, title string) *Proposal {
	return &Proposal{ID: id, Title: title, council: c, votes: map[string]Vote{}}
}

// Cast records a member's vote (one per member; members only; not after close).
func (p *Proposal) Cast(member string, v Vote) error {
	if p.closed {
		return ErrClosed
	}
	if !p.council.IsMember(member) {
		return ErrNotMember
	}
	if _, voted := p.votes[member]; voted {
		return ErrDuplicate
	}
	p.votes[member] = v
	return nil
}

// Outcome is the (advisory) result of a tally.
type Outcome struct {
	ProposalID  string  `json:"proposal_id"`
	Title       string  `json:"title"`
	Status      Status  `json:"status"`
	Yes         int     `json:"yes"`
	No          int     `json:"no"`
	Abstain     int     `json:"abstain"`
	Turnout     int     `json:"turnout"`
	Eligible    int     `json:"eligible"`
	Approval    float64 `json:"approval"`     // yes / (yes+no)
	Advisory    bool    `json:"advisory"`     // ALWAYS true — a council decision is advisory to the authority
	NeedsRatify bool    `json:"needs_ratify"` // a passed proposal must be ratified by the statutory authority
}

// Tally closes the proposal and grades it: quorum is the minimum turnout; threshold is the minimum approval
// among non-abstaining votes. The outcome is ALWAYS advisory — a passed proposal needs statutory ratification.
func (p *Proposal) Tally(quorum int, threshold float64) Outcome {
	p.closed = true
	o := Outcome{ProposalID: p.ID, Title: p.Title, Eligible: p.council.Size(), Advisory: true}
	for _, v := range p.votes {
		switch v {
		case Yes:
			o.Yes++
		case No:
			o.No++
		case Abstain:
			o.Abstain++
		}
	}
	o.Turnout = len(p.votes)
	decisive := o.Yes + o.No
	if decisive > 0 {
		o.Approval = float64(o.Yes) / float64(decisive)
	}
	switch {
	case o.Turnout < quorum:
		o.Status = NoQuorum
	case o.Approval >= threshold && decisive > 0:
		o.Status, o.NeedsRatify = Passed, true
	default:
		o.Status = Rejected
	}
	return o
}
