package integration

import (
	"errors"
	"log"
	"os"
	"sync"
	"time"

	"github.com/vasa-eos-se-tn/platform/grievance"
)

// The Grievance Redressal CASE service is the durable case-management counterpart to the AI grievance ROUTING
// in grievance.go: once a grievance is lodged it becomes a persistent case handled by a tier of officers under
// an SLA, and a case that BREACHES its SLA deadline auto-escalates to the next tier (time-driven escalation —
// the distinguishing feature). Durable to PostgreSQL when DATABASE_URL is set.
var (
	grievOnce sync.Once
	grievBack grievStore
)

// grievStore is the persistence port. *grievance.Store (in-memory) and *pgGrievStore (PostgreSQL) satisfy it.
type grievStore interface {
	File(id, complainant, category, subject, orgUnit string) (grievance.Grievance, error)
	Get(id string) (grievance.Grievance, bool)
	Resolve(id, actorRole, actorID, resolution string) (grievance.Grievance, error)
	Reject(id, actorRole, actorID, note string) (grievance.Grievance, error)
	Escalate(id, by, reason string) (grievance.Grievance, error)
	List(grievance.Filter) []grievance.Grievance
}

func grievState() grievStore {
	grievOnce.Do(func() {
		if dsn := os.Getenv("DATABASE_URL"); dsn != "" {
			if pg, err := newPgGrievStore(dsn); err == nil {
				grievBack = pg
				log.Printf("grievance-case: using durable PostgreSQL store (DATABASE_URL set)")
			} else {
				log.Printf("grievance-case: DATABASE_URL set but PostgreSQL unavailable (%v); using in-memory", err)
				grievBack = grievance.NewStore()
			}
		} else {
			grievBack = grievance.NewStore()
		}
	})
	return grievBack
}

// FileGrievanceCase lodges a new grievance case (open to any complainant — the public files these). Audited.
func (p *Platform) FileGrievanceCase(id, complainant, category, subject, orgUnit string) (grievance.Grievance, error) {
	g, err := grievState().File(id, complainant, category, subject, orgUnit)
	if err != nil {
		return grievance.Grievance{}, err
	}
	p.appendAudit("complainant:"+complainant, "grievance.case.file", id, "executed", category+" @ "+orgUnit)
	return g, nil
}

// HandleGrievanceCase applies a handler's action at the current tier: "resolve" | "reject" | "escalate".
// resolve/reject are fail-closed (the actor must hold the current tier's role).
func (p *Platform) HandleGrievanceCase(id, action, actorRole, actorID, note string) (grievance.Grievance, error) {
	var out grievance.Grievance
	var err error
	switch action {
	case "resolve":
		out, err = grievState().Resolve(id, actorRole, actorID, note)
	case "reject":
		out, err = grievState().Reject(id, actorRole, actorID, note)
	case "escalate":
		out, err = grievState().Escalate(id, actorID, note)
	default:
		return grievance.Grievance{}, errors.New("grievance: action must be resolve, reject or escalate")
	}
	if err != nil {
		p.appendAudit("role:"+actorRole, "grievance.case."+action+".denied", id, "deny", err.Error())
		return grievance.Grievance{}, err
	}
	p.appendAudit("role:"+actorRole, "grievance.case."+action, id, "executed", "status="+out.Status)
	return out, nil
}

// EscalateOverdueCases is the SLA enforcement sweep: every OPEN case past its deadline is escalated to the next
// tier automatically ("sla" actor). Returns the ids escalated — the engine that makes the SLA real.
func (p *Platform) EscalateOverdueCases() []string {
	now := time.Now().UTC().Format(time.RFC3339)
	var escalated []string
	for _, g := range grievState().List(grievance.Filter{Status: grievance.Open}) {
		if grievance.Overdue(g, now) {
			if out, err := grievState().Escalate(g.ID, "sla", "SLA breached — auto-escalated"); err == nil {
				escalated = append(escalated, g.ID)
				p.appendAudit("system:sla", "grievance.case.escalate.sla", g.ID, "executed", "status="+out.Status)
			}
		}
	}
	return escalated
}

// GrievanceCase returns one case.
func (p *Platform) GrievanceCase(id string) (grievance.Grievance, bool) { return grievState().Get(id) }

// GrievanceCaseDashboard is the jurisdiction-scoped redressal operating picture.
type GrievanceCaseDashboard struct {
	Scope      string                `json:"scope"`
	Total      int                   `json:"total"`
	ByStatus   map[string]int        `json:"by_status"`
	ByCategory map[string]int        `json:"by_category"`
	Overdue    int                   `json:"overdue"`
	Open       []grievance.Grievance `json:"open"`
	Synthetic  bool                  `json:"synthetic"`
}

// GrievanceCaseDashboard rolls up the cases a tenant node governs (downward-governance scoped).
func (p *Platform) GrievanceCaseDashboard(scopeOrg string) GrievanceCaseDashboard {
	d := GrievanceCaseDashboard{Scope: scopeOrg, ByStatus: map[string]int{}, ByCategory: map[string]int{}, Synthetic: true}
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return d
	}
	now := time.Now().UTC().Format(time.RFC3339)
	for _, g := range grievState().List(grievance.Filter{}) {
		if !h.Governs(scopeOrg, g.OrgUnit) {
			continue
		}
		d.Total++
		d.ByStatus[g.Status]++
		d.ByCategory[g.Category]++
		if grievance.Overdue(g, now) {
			d.Overdue++
		}
		if g.Status == grievance.Open {
			d.Open = append(d.Open, g)
		}
	}
	return d
}

// GrievanceCasesScopedBy returns the cases a tenant node governs, filtered by status.
func (p *Platform) GrievanceCasesScopedBy(scopeOrg, status string) []grievance.Grievance {
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return nil
	}
	var out []grievance.Grievance
	for _, g := range grievState().List(grievance.Filter{Status: status}) {
		if h.Governs(scopeOrg, g.OrgUnit) {
			out = append(out, g)
		}
	}
	return out
}
