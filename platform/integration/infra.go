package integration

import (
	"fmt"
	"log"
	"os"
	"sync"

	"github.com/vasa-eos-se-tn/platform/infra"
)

// Infrastructure & Asset Register is an L6 constraint-checked operational vertical: it registers a school's
// physical assets/rooms (with a condition grade) and the maintenance tickets raised against them, enforcing the
// ticket lifecycle and the rule that an asset can never be decommissioned while it still has open tickets.
// Durable to PostgreSQL.
var (
	infraOnce sync.Once
	infraBack infraStore
)

// infraStore is the persistence port (assets + maintenance tickets).
type infraStore interface {
	UpsertAsset(infra.Asset) (infra.Asset, error)
	GetAsset(id string) (infra.Asset, bool)
	RaiseTicket(infra.Ticket) (infra.Ticket, error)
	AssignTicket(id, assignee string) (infra.Ticket, error)
	ResolveTicket(id, on string) (infra.Ticket, error)
	CloseTicket(id string) (infra.Ticket, error)
	DecommissionAsset(id string) (infra.Asset, error)
	ReturnAssetToService(id, condition string) (infra.Asset, error)
	ListAssets(infra.AssetFilter) []infra.Asset
	ListTickets(infra.TicketFilter) []infra.Ticket
}

func infraState() infraStore {
	infraOnce.Do(func() {
		if dsn := os.Getenv("DATABASE_URL"); dsn != "" {
			if pg, err := newPgInfraStore(dsn); err == nil {
				infraBack = pg
				log.Printf("infra: using durable PostgreSQL store (DATABASE_URL set)")
			} else {
				log.Printf("infra: DATABASE_URL set but PostgreSQL unavailable (%v); using in-memory", err)
				infraBack = infra.NewStore()
			}
		} else {
			infraBack = infra.NewStore()
		}
		seedInfra(infraBack)
	})
	return infraBack
}

// seedInfra plants a representative asset register at a real Chennai school — rooms, ICT, furniture, sanitation
// across condition grades — plus a couple of live maintenance tickets (one critical, flipping its asset to
// under_maintenance) so the dashboard analytics have signal. Synthetic; no real PII.
func seedInfra(s infraStore) {
	school := tenancyLeafUnder(pilotDistrict())
	if school == "" {
		return
	}
	assets := []infra.Asset{
		{ID: "AST-CHN-CLASS-8A", OrgUnit: school, Name: "Classroom 8-A", Category: "room", Condition: infra.Good, Status: infra.InService, AcquiredOn: "2015-06-01"},
		{ID: "AST-CHN-LAB-COMP", OrgUnit: school, Name: "Computer Lab", Category: "ict", Condition: infra.Fair, Status: infra.InService, AcquiredOn: "2019-07-15"},
		{ID: "AST-CHN-TOILET-G", OrgUnit: school, Name: "Girls' Toilet Block", Category: "sanitation", Condition: infra.Poor, Status: infra.InService, AcquiredOn: "2014-01-10"},
		{ID: "AST-CHN-FURN-DESK", OrgUnit: school, Name: "Desk Set (Block A)", Category: "furniture", Condition: infra.Fair, Status: infra.InService, AcquiredOn: "2018-04-01"},
		{ID: "AST-CHN-LIB-ROOM", OrgUnit: school, Name: "Library Room", Category: "room", Condition: infra.Good, Status: infra.InService, AcquiredOn: "2016-08-20"},
	}
	for _, a := range assets {
		s.UpsertAsset(a)
	}
	// a critical sanitation ticket (auto-flips the toilet block to under_maintenance) and a routine ICT ticket.
	s.RaiseTicket(infra.Ticket{ID: "MTK-CHN-001", AssetID: "AST-CHN-TOILET-G", OrgUnit: school, Issue: "Water supply failure; block unusable", Severity: infra.SevCritical, RaisedOn: "2026-06-15"})
	s.RaiseTicket(infra.Ticket{ID: "MTK-CHN-002", AssetID: "AST-CHN-LAB-COMP", OrgUnit: school, Issue: "5 desktops not powering on", Severity: infra.SevMedium, RaisedOn: "2026-06-17"})
	s.AssignTicket("MTK-CHN-002", "SYN-TECH-01")
}

// RegisterAsset upserts an asset into the register. Audited.
func (p *Platform) RegisterAsset(a infra.Asset) (infra.Asset, error) {
	out, err := infraState().UpsertAsset(a)
	if err != nil {
		p.appendAudit("estate-officer", "infra.asset.denied", a.ID, "deny", err.Error())
		return infra.Asset{}, err
	}
	p.appendAudit("estate-officer", "infra.asset", a.ID, "executed", fmt.Sprintf("%s (%s/%s)", a.Name, a.Condition, a.Status))
	return out, nil
}

// RaiseMaintenanceTicket opens a maintenance ticket against an asset. Audited.
func (p *Platform) RaiseMaintenanceTicket(t infra.Ticket) (infra.Ticket, error) {
	out, err := infraState().RaiseTicket(t)
	if err != nil {
		p.appendAudit("estate-officer", "infra.ticket.denied", t.AssetID, "deny", err.Error())
		return infra.Ticket{}, err
	}
	p.appendAudit("estate-officer", "infra.ticket.raise", t.ID, out.Severity, t.Issue)
	return out, nil
}

// AdvanceTicket walks a maintenance ticket along its lifecycle (assign → resolve → close). Audited.
func (p *Platform) AdvanceTicket(id, action, arg string) (infra.Ticket, error) {
	var out infra.Ticket
	var err error
	switch action {
	case "assign":
		out, err = infraState().AssignTicket(id, arg)
	case "resolve":
		out, err = infraState().ResolveTicket(id, arg)
	case "close":
		out, err = infraState().CloseTicket(id)
	default:
		err = fmt.Errorf("infra: unknown ticket action %q", action)
	}
	if err != nil {
		p.appendAudit("estate-officer", "infra.ticket."+action+".denied", id, "deny", err.Error())
		return infra.Ticket{}, err
	}
	p.appendAudit("estate-officer", "infra.ticket."+action, id, out.Status, arg)
	return out, nil
}

// DecommissionAsset retires an asset (refused while it has open tickets). Audited.
func (p *Platform) DecommissionAsset(id string) (infra.Asset, error) {
	out, err := infraState().DecommissionAsset(id)
	if err != nil {
		p.appendAudit("estate-officer", "infra.decommission.denied", id, "deny", err.Error())
		return infra.Asset{}, err
	}
	p.appendAudit("estate-officer", "infra.decommission", id, "executed", "asset retired")
	return out, nil
}

// ReturnAssetToService returns an asset to service after maintenance (refused while open tickets remain). Audited.
func (p *Platform) ReturnAssetToService(id, condition string) (infra.Asset, error) {
	out, err := infraState().ReturnAssetToService(id, condition)
	if err != nil {
		p.appendAudit("estate-officer", "infra.return.denied", id, "deny", err.Error())
		return infra.Asset{}, err
	}
	p.appendAudit("estate-officer", "infra.return", id, "executed", "back in service ("+out.Condition+")")
	return out, nil
}

// AssetTickets returns the maintenance tickets raised against an asset (most recent first).
func (p *Platform) AssetTickets(assetID string) []infra.Ticket {
	return infraState().ListTickets(infra.TicketFilter{AssetID: assetID})
}

// InfraDashboard is the jurisdiction-scoped estate picture: asset counts by condition + status, the open
// maintenance backlog by severity, and the assets-needing-attention roster (unusable, under maintenance, or
// carrying a critical open ticket). Downward-governance scoped.
type InfraDashboard struct {
	Scope            string         `json:"scope"`
	Assets           int            `json:"assets"`
	ByCondition      map[string]int `json:"by_condition"`
	UnderMaintenance int            `json:"under_maintenance"`
	Decommissioned   int            `json:"decommissioned"`
	OpenTickets      int            `json:"open_tickets"`
	BySeverity       map[string]int `json:"open_by_severity"`
	NeedsAttention   []infra.Asset  `json:"needs_attention,omitempty"`
	Synthetic        bool           `json:"synthetic"`
}

// InfraDashboard rolls up the asset register + maintenance backlog for the schools a tenant node governs.
func (p *Platform) InfraDashboard(scopeOrg string) InfraDashboard {
	d := InfraDashboard{Scope: scopeOrg, ByCondition: map[string]int{}, BySeverity: map[string]int{}, Synthetic: true}
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return d
	}
	tickets := infraState().ListTickets(infra.TicketFilter{})
	// index active critical tickets by asset for the needs-attention roster.
	criticalOpen := map[string]bool{}
	for _, t := range tickets {
		if !h.Governs(scopeOrg, t.OrgUnit) {
			continue
		}
		if t.Active() {
			d.OpenTickets++
			d.BySeverity[t.Severity]++
			if t.Severity == infra.SevCritical {
				criticalOpen[t.AssetID] = true
			}
		}
	}
	for _, a := range infraState().ListAssets(infra.AssetFilter{}) {
		if !h.Governs(scopeOrg, a.OrgUnit) {
			continue
		}
		d.Assets++
		d.ByCondition[a.Condition]++
		switch a.Status {
		case infra.UnderMaintenance:
			d.UnderMaintenance++
		case infra.Decommissioned:
			d.Decommissioned++
		}
		if a.Condition == infra.Unusable || a.Status == infra.UnderMaintenance || criticalOpen[a.ID] {
			d.NeedsAttention = append(d.NeedsAttention, a)
		}
	}
	return d
}
