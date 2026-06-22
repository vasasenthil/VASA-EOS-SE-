package integration

import (
	"os"
	"testing"

	"github.com/vasa-eos-se-tn/platform/infra"
)

// TestPgInfraDurable proves assets + maintenance tickets persist across fresh instances, the ticket lifecycle
// and the no-decommission-with-open-tickets invariant are enforced durably, and a critical ticket's
// auto-flip-to-maintenance survives a fresh store. Runs only with DATABASE_URL set.
func TestPgInfraDurable(t *testing.T) {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		t.Skip("DATABASE_URL not set; durable PostgreSQL infra test runs against a live database only")
	}
	s1, err := newPgInfraStore(dsn)
	if err != nil {
		t.Fatalf("connect/migrate: %v", err)
	}
	if _, err := s1.db.Exec(`DELETE FROM infra_tickets WHERE org_unit='PGI-SCH'`); err != nil {
		t.Fatalf("cleanup tickets: %v", err)
	}
	if _, err := s1.db.Exec(`DELETE FROM infra_assets WHERE org_unit='PGI-SCH'`); err != nil {
		t.Fatalf("cleanup assets: %v", err)
	}
	ast := func(id, condition, status string) infra.Asset {
		return infra.Asset{ID: id, OrgUnit: "PGI-SCH", Name: id, Category: "ict", Condition: condition, Status: status, AcquiredOn: "2020-01-01"}
	}
	tkt := func(id, asset, sev string) infra.Ticket {
		return infra.Ticket{ID: id, AssetID: asset, OrgUnit: "PGI-SCH", Issue: "fault", Severity: sev, RaisedOn: "2026-06-10"}
	}

	if _, err := s1.UpsertAsset(ast("PGI-A1", infra.Fair, infra.InService)); err != nil {
		t.Fatalf("asset: %v", err)
	}
	// a critical ticket auto-flips the asset to under_maintenance.
	if _, err := s1.RaiseTicket(tkt("PGI-T1", "PGI-A1", infra.SevCritical)); err != nil {
		t.Fatalf("raise: %v", err)
	}
	// the asset cannot be decommissioned while the ticket is open (durable invariant).
	if _, err := s1.DecommissionAsset("PGI-A1"); err == nil {
		t.Fatal("a durable open ticket must block decommission")
	}

	// fresh instance: asset state + ticket durable, auto-flip persisted, invariant still enforced.
	s2, _ := newPgInfraStore(dsn)
	if a, ok := s2.GetAsset("PGI-A1"); !ok || a.Status != infra.UnderMaintenance {
		t.Fatalf("critical auto-flip not durable: %+v", a)
	}
	if _, err := s2.DecommissionAsset("PGI-A1"); err == nil {
		t.Fatal("the open-ticket block must persist across instances")
	}
	// walk the ticket to closed.
	if _, err := s2.AssignTicket("PGI-T1", "SYN-TECH-1"); err != nil {
		t.Fatalf("assign: %v", err)
	}
	if _, err := s2.ResolveTicket("PGI-T1", "2026-06-12"); err != nil {
		t.Fatalf("resolve: %v", err)
	}
	if _, err := s2.CloseTicket("PGI-T1"); err != nil {
		t.Fatalf("close: %v", err)
	}
	// fresh instance: ticket closed durably → return to service now allowed, then decommission allowed.
	s3, _ := newPgInfraStore(dsn)
	if tk, _ := s3.GetTicket("PGI-T1"); tk.Status != infra.TicketClosed {
		t.Fatalf("ticket close not durable: %+v", tk)
	}
	if a, err := s3.ReturnAssetToService("PGI-A1", infra.Good); err != nil || a.Status != infra.InService || a.Condition != infra.Good {
		t.Fatalf("return to service: %+v err=%v", a, err)
	}
	if a, err := s3.DecommissionAsset("PGI-A1"); err != nil || a.Status != infra.Decommissioned {
		t.Fatalf("decommission after clearing tickets: %+v err=%v", a, err)
	}
	// a ticket against the now-decommissioned asset is refused, durably.
	s4, _ := newPgInfraStore(dsn)
	if _, err := s4.RaiseTicket(tkt("PGI-T2", "PGI-A1", infra.SevLow)); err == nil {
		t.Fatal("a ticket against a durable decommissioned asset must be rejected")
	}
}

// TestInfraDashboardScoped proves the seeded register rolls up condition/status + the maintenance backlog and
// the needs-attention roster (in-memory path).
func TestInfraDashboardScoped(t *testing.T) {
	p := newPlatform(t)
	d := p.InfraDashboard("TN-DIST-Chennai")
	if d.Assets == 0 || len(d.ByCondition) == 0 {
		t.Fatalf("seeded register must roll up: %+v", d)
	}
	// the seed raises a critical ticket (toilet block) → under_maintenance + open backlog + needs-attention.
	if d.OpenTickets == 0 || d.UnderMaintenance == 0 || len(d.NeedsAttention) == 0 {
		t.Fatalf("seeded maintenance backlog + needs-attention roster must surface: %+v", d)
	}
	if d.BySeverity[infra.SevCritical] == 0 {
		t.Fatalf("the open-by-severity breakdown must count the critical ticket: %+v", d)
	}
	// an asset's ticket history is non-empty for the seeded critical asset.
	if len(p.AssetTickets("AST-CHN-TOILET-G")) == 0 {
		t.Fatal("a seeded asset must have a ticket history")
	}
	// unknown scope → nothing (fail-closed).
	if u := p.InfraDashboard("TN-DIST-Nowhere"); u.Assets != 0 {
		t.Fatalf("unknown scope must see nothing: %+v", u)
	}
}
