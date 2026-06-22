package integration

import (
	"fmt"
	"log"
	"os"
	"sync"

	"github.com/vasa-eos-se-tn/platform/entitlement"
)

// Free-Supply Entitlement Distribution is an L6 accountability vertical: it grants each student their
// entitlement under TN's free-supply schemes (textbooks, uniforms, …) and records what is issued, enforcing
// that a student can never be issued more than their entitlement (the over-issue gate). Durable to PostgreSQL.
var (
	entOnce sync.Once
	entBack entStore
)

// entStore is the persistence port (entitlements + issues).
type entStore interface {
	GrantEntitlement(entitlement.Entitlement) (entitlement.Entitlement, error)
	GetEntitlement(id string) (entitlement.Entitlement, bool)
	IssueSupply(entitlement.Issue) (entitlement.Issue, error)
	Remaining(id string) int
	ListEntitlements(entitlement.EntitlementFilter) []entitlement.Entitlement
	ListIssues(entitlement.IssueFilter) []entitlement.Issue
}

func entState() entStore {
	entOnce.Do(func() {
		if dsn := os.Getenv("DATABASE_URL"); dsn != "" {
			if pg, err := newPgEntStore(dsn); err == nil {
				entBack = pg
				log.Printf("entitlement: using durable PostgreSQL store (DATABASE_URL set)")
			} else {
				log.Printf("entitlement: DATABASE_URL set but PostgreSQL unavailable (%v); using in-memory", err)
				entBack = entitlement.NewStore()
			}
		} else {
			entBack = entitlement.NewStore()
		}
		seedEntitlement(entBack)
	})
	return entBack
}

// seedEntitlement plants a 2026 free-supply roll at a real Chennai school: each child entitled to textbooks (1
// set), uniforms (4 sets) and notebooks (1 set); most fully supplied, some partial, a couple pending — so the
// fulfilment + pending analytics have signal. Synthetic SYN-S ids, never real PII.
func seedEntitlement(s entStore) {
	school := tenancyLeafUnder(pilotDistrict())
	if school == "" {
		return
	}
	items := []struct {
		item string
		qty  int
	}{{"textbook", 1}, {"uniform", 4}, {"notebook", 1}}
	for n := 1; n <= 8; n++ {
		student := fmt.Sprintf("SYN-S-%03d", n)
		for _, it := range items {
			eid := fmt.Sprintf("ENT-CHN-%03d-%s", n, it.item)
			s.GrantEntitlement(entitlement.Entitlement{ID: eid, OrgUnit: school, StudentID: student, Item: it.item, EntitledQty: it.qty, Term: "2026", Status: entitlement.Pending})
			// children 1..5 fully supplied; 6..7 partial (uniforms half-issued); 8 pending (nothing issued).
			issue := 0
			switch {
			case n <= 5:
				issue = it.qty
			case n <= 7 && it.item == "uniform":
				issue = 2
			}
			if issue > 0 {
				s.IssueSupply(entitlement.Issue{ID: eid + "-ISS-1", EntitlementID: eid, OrgUnit: school, StudentID: student, Qty: issue, IssuedOn: "2026-06-05", Reference: "GRN-" + eid})
			}
		}
	}
}

// GrantEntitlement grants a student's free-supply entitlement. Audited.
func (p *Platform) GrantEntitlement(e entitlement.Entitlement) (entitlement.Entitlement, error) {
	out, err := entState().GrantEntitlement(e)
	if err != nil {
		p.appendAudit("supplies-clerk", "entitlement.grant.denied", e.ID, "deny", err.Error())
		return entitlement.Entitlement{}, err
	}
	p.appendAudit("supplies-clerk", "entitlement.grant", e.ID, out.Status, fmt.Sprintf("%s x%d", e.Item, e.EntitledQty))
	return out, nil
}

// IssueSupply records a distribution against an entitlement (rejecting an over-issue). Audited.
func (p *Platform) IssueSupply(i entitlement.Issue) (entitlement.Issue, error) {
	out, err := entState().IssueSupply(i)
	if err != nil {
		p.appendAudit("supplies-clerk", "entitlement.issue.denied", i.EntitlementID, "deny", err.Error())
		return entitlement.Issue{}, err
	}
	p.appendAudit("supplies-clerk", "entitlement.issue", i.ID, "executed", fmt.Sprintf("x%d ref %s", i.Qty, i.Reference))
	return out, nil
}

// StudentEntitlements returns a student's entitlements and the issues made against them.
func (p *Platform) StudentEntitlements(org, student string) ([]entitlement.Entitlement, []entitlement.Issue) {
	return entState().ListEntitlements(entitlement.EntitlementFilter{OrgUnit: org, Student: student}),
		entState().ListIssues(entitlement.IssueFilter{OrgUnit: org, Student: student})
}

// ItemFulfilment is one item's distribution line in the dashboard.
type ItemFulfilment struct {
	Item          string  `json:"item"`
	EntitledQty   int     `json:"entitled_qty"`
	IssuedQty     int     `json:"issued_qty"`
	Fulfilled     int     `json:"fulfilled_students"`
	Pending       int     `json:"pending_students"`
	FulfilmentPct float64 `json:"fulfilment_pct"`
}

// EntitlementShortfall is one not-yet-fulfilled entitlement in the dashboard worklist.
type EntitlementShortfall struct {
	EntitlementID string `json:"entitlement_id"`
	StudentID     string `json:"student_id"`
	Item          string `json:"item"`
	Remaining     int    `json:"remaining"`
}

// EntitlementDashboard is the jurisdiction-scoped free-supply distribution picture: per-item entitled vs issued
// (fulfilment %), fulfilled-vs-pending student counts, and the shortfall worklist. Downward-governance scoped.
type EntitlementDashboard struct {
	Scope     string                 `json:"scope"`
	Students  int                    `json:"students"`
	Items     []ItemFulfilment       `json:"items"`
	Shortfall []EntitlementShortfall `json:"shortfall,omitempty"`
	Synthetic bool                   `json:"synthetic"`
}

// EntitlementDashboard rolls up free-supply distribution for the schools a tenant node governs.
func (p *Platform) EntitlementDashboard(scopeOrg string) EntitlementDashboard {
	d := EntitlementDashboard{Scope: scopeOrg, Synthetic: true}
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return d
	}
	issues := entState().ListIssues(entitlement.IssueFilter{})
	byItem := map[string]*ItemFulfilment{}
	students := map[string]bool{}
	for _, e := range entState().ListEntitlements(entitlement.EntitlementFilter{}) {
		if !h.Governs(scopeOrg, e.OrgUnit) {
			continue
		}
		students[e.StudentID] = true
		issued := entitlement.IssuedSoFar(issues, e.ID, "")
		it := byItem[e.Item]
		if it == nil {
			it = &ItemFulfilment{Item: e.Item}
			byItem[e.Item] = it
		}
		it.EntitledQty += e.EntitledQty
		it.IssuedQty += issued
		if e.Status == entitlement.Fulfilled || issued >= e.EntitledQty {
			it.Fulfilled++
		} else {
			it.Pending++
			d.Shortfall = append(d.Shortfall, EntitlementShortfall{
				EntitlementID: e.ID, StudentID: e.StudentID, Item: e.Item, Remaining: e.EntitledQty - issued,
			})
		}
	}
	d.Students = len(students)
	for _, it := range byItem {
		if it.EntitledQty > 0 {
			it.FulfilmentPct = float64(it.IssuedQty) * 100 / float64(it.EntitledQty)
		}
		d.Items = append(d.Items, *it)
	}
	sortItemFulfilment(d.Items)
	return d
}

// sortItemFulfilment orders the item lines by item name for a stable dashboard.
func sortItemFulfilment(items []ItemFulfilment) {
	for i := 1; i < len(items); i++ {
		for j := i; j > 0 && items[j-1].Item > items[j].Item; j-- {
			items[j-1], items[j] = items[j], items[j-1]
		}
	}
}
