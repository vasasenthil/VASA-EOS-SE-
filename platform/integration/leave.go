package integration

import (
	"log"
	"os"
	"sync"

	"github.com/vasa-eos-se-tn/platform/leave"
)

// The Staff Leave & Approval service is the canonical end-to-end workflow connecting the Next.js frontend to
// this Go backbone: a teacher files leave from the app, which calls platformd, which persists to PostgreSQL
// and routes the request through a DYNAMIC multi-level chain (principal → +BEO over 5 days → +DEO over 15
// days). Every decision is audited.
var (
	leaveOnce sync.Once
	leaveBack leaveStore
)

// leaveStore is the persistence port. *leave.Store (in-memory) and *pgLeaveStore (PostgreSQL) satisfy it.
type leaveStore interface {
	File(id, employee, ltype, from, to, reason, orgUnit string) (leave.Request, error)
	Get(id string) (leave.Request, bool)
	Decide(id string, approve bool, actorRole, actorID, note string) (leave.Request, error)
	List(leave.Filter) []leave.Request
}

func leaveState() leaveStore {
	leaveOnce.Do(func() {
		if dsn := os.Getenv("DATABASE_URL"); dsn != "" {
			if pg, err := newPgLeaveStore(dsn); err == nil {
				leaveBack = pg
				log.Printf("leave: using durable PostgreSQL store (DATABASE_URL set)")
			} else {
				log.Printf("leave: DATABASE_URL set but PostgreSQL unavailable (%v); using in-memory", err)
				leaveBack = leave.NewStore()
			}
		} else {
			leaveBack = leave.NewStore()
		}
	})
	return leaveBack
}

// FileLeave files a new leave request (the action the frontend's "Submit leave request" button triggers).
func (p *Platform) FileLeave(id, employee, ltype, from, to, reason, orgUnit string) (leave.Request, error) {
	r, err := leaveState().File(id, employee, ltype, from, to, reason, orgUnit)
	if err != nil {
		return leave.Request{}, err
	}
	p.appendAudit("employee:"+employee, "leave.file", id, "executed", r.Type)
	return r, nil
}

// DecideLeave applies an approver's decision at the request's current level (multi-level, fail-closed: the
// actor must hold the level's role). Audited.
func (p *Platform) DecideLeave(id string, approve bool, actorRole, actorID, note string) (leave.Request, error) {
	out, err := leaveState().Decide(id, approve, actorRole, actorID, note)
	effect := "approved"
	if !approve {
		effect = "rejected"
	}
	if err != nil {
		p.appendAudit("role:"+actorRole, "leave.decide.denied", id, "deny", err.Error())
		return leave.Request{}, err
	}
	p.appendAudit("role:"+actorRole, "leave.decide", id, effect, "status="+out.Status)
	return out, nil
}

// LeaveRequest returns a single request.
func (p *Platform) LeaveRequest(id string) (leave.Request, bool) { return leaveState().Get(id) }

// LeaveScopedBy returns the leave requests a tenant node governs (downward governance), most recent first.
func (p *Platform) LeaveScopedBy(scopeOrg, status string) []leave.Request {
	all := leaveState().List(leave.Filter{Status: status})
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return nil
	}
	var out []leave.Request
	for _, r := range all {
		if h.Governs(scopeOrg, r.OrgUnit) {
			out = append(out, r)
		}
	}
	return out
}

// LeaveInboxFor returns the pending requests in a jurisdiction whose CURRENT level is the given approver role —
// the role-gated approval inbox (a principal/BEO/DEO sees only what awaits their signature).
func (p *Platform) LeaveInboxFor(scopeOrg, approverRole string) []leave.Request {
	var out []leave.Request
	for _, r := range p.LeaveScopedBy(scopeOrg, leave.Pending) {
		if r.CurrentStep < len(r.Chain) && r.Chain[r.CurrentStep].Role == approverRole {
			out = append(out, r)
		}
	}
	return out
}
