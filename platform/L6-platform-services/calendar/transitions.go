package calendar

import "errors"

// This file holds the PURE approval-chain transitions, decoupled from storage so that EVERY backend — the
// in-memory Store and the production Postgres adapter — applies exactly the same domain rules. A backend
// loads an Entry, calls one of these, and persists the result.

// ApplySubmit moves a Draft/Rejected entry into its approval chain (pure). An empty chain auto-approves a
// zero-stakes local entry. `now` is the caller's timestamp.
func ApplySubmit(e Entry, chain []ApprovalStep, now string) (Entry, error) {
	if e.Status != Draft && e.Status != Rejected {
		return Entry{}, errors.New("calendar: only a draft or rejected entry can be submitted")
	}
	e.Chain = append([]ApprovalStep(nil), chain...)
	e.CurrentStep = 0
	e.UpdatedAt = now
	if len(e.Chain) == 0 {
		e.Status = Approved
	} else {
		e.Status = Pending
	}
	return e, nil
}

// ApplyAct applies an approve/reject decision at the entry's current level (pure, fail-closed). The actor must
// hold the level's role AND its required scope. Approve advances (publishes on the last level); reject stops
// the chain. `now` is the caller's timestamp.
func ApplyAct(e Entry, approve bool, actorID, actorRole string, scopes []string, note, now string) (Entry, error) {
	if e.Status != Pending {
		return Entry{}, errors.New("calendar: entry is not awaiting approval")
	}
	if e.CurrentStep < 0 || e.CurrentStep >= len(e.Chain) {
		return Entry{}, errors.New("calendar: approval chain is exhausted")
	}
	step := e.Chain[e.CurrentStep]
	if actorRole != step.ApproverRole {
		return Entry{}, errors.New("calendar: actor role " + actorRole + " may not act at tier " + step.Tier)
	}
	if step.RequiredScope != "" && !hasScope(scopes, step.RequiredScope) {
		return Entry{}, errors.New("calendar: actor lacks the required scope " + step.RequiredScope)
	}
	// copy the chain so callers holding the prior Entry are not mutated underneath them.
	e.Chain = append([]ApprovalStep(nil), e.Chain...)
	step.DecidedBy, step.DecidedAt, step.Note = actorID, now, note
	if approve {
		step.Decision = "approved"
		e.Chain[e.CurrentStep] = step
		e.CurrentStep++
		if e.CurrentStep >= len(e.Chain) {
			e.Status = Approved
		}
	} else {
		step.Decision = "rejected"
		e.Chain[e.CurrentStep] = step
		e.Status = Rejected
	}
	e.UpdatedAt = now
	return e, nil
}

// ApplyUpdate edits an entry's mutable fields (pure). Only Draft/Rejected entries may be edited.
func ApplyUpdate(e Entry, title, etype, start, end, desc, now string) (Entry, error) {
	if e.Status == Pending || e.Status == Approved {
		return Entry{}, errors.New("calendar: cannot edit an entry that is in approval or published")
	}
	e.Title, e.Type, e.StartDate, e.EndDate, e.Description = title, etype, start, end, desc
	if err := e.Validate(); err != nil {
		return Entry{}, err
	}
	e.UpdatedAt = now
	return e, nil
}
