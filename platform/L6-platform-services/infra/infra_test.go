package infra

import "testing"

func asset(id, category, condition, status string) Asset {
	return Asset{ID: id, OrgUnit: "SCH1", Name: "Asset " + id, Category: category, Condition: condition, Status: status, AcquiredOn: "2020-06-01"}
}

func ticket(id, assetID, severity string) Ticket {
	return Ticket{ID: id, AssetID: assetID, OrgUnit: "SCH1", Issue: "broken", Severity: severity, RaisedOn: "2026-06-10"}
}

func TestAssetValidation(t *testing.T) {
	s := NewStore()
	if _, err := s.UpsertAsset(asset("A1", "room", "excellent", InService)); err == nil {
		t.Fatal("invalid condition rejected")
	}
	if _, err := s.UpsertAsset(Asset{ID: "A1", OrgUnit: "SCH1", Name: "x", Category: "", Condition: Good, Status: InService}); err == nil {
		t.Fatal("missing category rejected")
	}
	if _, err := s.UpsertAsset(asset("A1", "room", Good, "broken")); err == nil {
		t.Fatal("invalid status rejected")
	}
	if _, err := s.UpsertAsset(asset("A1", "room", Good, InService)); err != nil {
		t.Fatalf("valid asset: %v", err)
	}
}

func TestTicketLifecycle(t *testing.T) {
	s := NewStore()
	s.UpsertAsset(asset("A1", "ict", Fair, InService))
	if _, err := s.RaiseTicket(ticket("T1", "A1", SevMedium)); err != nil {
		t.Fatalf("raise: %v", err)
	}
	// cannot resolve before assigning (skipping a state).
	if _, err := s.ResolveTicket("T1", "2026-06-11"); err == nil {
		t.Fatal("an open ticket cannot jump straight to resolved")
	}
	if _, err := s.AssignTicket("T1", "SYN-TECH-1"); err != nil {
		t.Fatalf("assign: %v", err)
	}
	// cannot close before resolving.
	if _, err := s.CloseTicket("T1"); err == nil {
		t.Fatal("an in-progress ticket cannot be closed")
	}
	if _, err := s.ResolveTicket("T1", "2026-06-12"); err != nil {
		t.Fatalf("resolve: %v", err)
	}
	if c, err := s.CloseTicket("T1"); err != nil || c.Status != TicketClosed {
		t.Fatalf("close: %+v err=%v", c, err)
	}
	// assigning without an assignee fails.
	s.RaiseTicket(ticket("T2", "A1", SevLow))
	if _, err := s.AssignTicket("T2", ""); err == nil {
		t.Fatal("assign requires an assignee")
	}
}

func TestCriticalTicketFlipsAssetToMaintenance(t *testing.T) {
	s := NewStore()
	s.UpsertAsset(asset("A1", "sanitation", Poor, InService))
	if _, err := s.RaiseTicket(ticket("T1", "A1", SevCritical)); err != nil {
		t.Fatalf("raise critical: %v", err)
	}
	if a, _ := s.GetAsset("A1"); a.Status != UnderMaintenance {
		t.Fatalf("a critical ticket must flip the asset to under_maintenance: %s", a.Status)
	}
}

func TestRaiseAgainstUnknownOrDecommissioned(t *testing.T) {
	s := NewStore()
	if _, err := s.RaiseTicket(ticket("T1", "GHOST", SevLow)); err == nil {
		t.Fatal("a ticket against an unknown asset must be rejected")
	}
	s.UpsertAsset(asset("A1", "room", Good, InService))
	s.DecommissionAsset("A1")
	if _, err := s.RaiseTicket(ticket("T2", "A1", SevLow)); err == nil {
		t.Fatal("a ticket against a decommissioned asset must be rejected")
	}
}

func TestDecommissionInvariant(t *testing.T) {
	s := NewStore()
	s.UpsertAsset(asset("A1", "equipment", Poor, InService))
	s.RaiseTicket(ticket("T1", "A1", SevHigh))
	s.AssignTicket("T1", "SYN-TECH-1")
	// an asset with an active (in-progress) ticket cannot be decommissioned.
	if _, err := s.DecommissionAsset("A1"); err == nil {
		t.Fatal("an asset with open tickets cannot be decommissioned")
	}
	// resolve + close the ticket → now it can be decommissioned.
	s.ResolveTicket("T1", "2026-06-12")
	s.CloseTicket("T1")
	if a, err := s.DecommissionAsset("A1"); err != nil || a.Status != Decommissioned {
		t.Fatalf("a clear asset must decommission: %+v err=%v", a, err)
	}
	// decommissioning an unknown asset fails.
	if _, err := s.DecommissionAsset("GHOST"); err == nil {
		t.Fatal("unknown asset decommission must fail")
	}
}

func TestReturnToService(t *testing.T) {
	s := NewStore()
	s.UpsertAsset(asset("A1", "ict", Poor, InService))
	s.RaiseTicket(ticket("T1", "A1", SevCritical)) // flips to under_maintenance
	// cannot return to service while a ticket is open.
	if _, err := s.ReturnAssetToService("A1", Good); err == nil {
		t.Fatal("cannot return to service with open tickets")
	}
	s.AssignTicket("T1", "SYN-TECH-1")
	s.ResolveTicket("T1", "2026-06-12")
	s.CloseTicket("T1")
	a, err := s.ReturnAssetToService("A1", Good)
	if err != nil || a.Status != InService || a.Condition != Good {
		t.Fatalf("return to service: %+v err=%v", a, err)
	}
	// a decommissioned asset cannot return.
	s2 := NewStore()
	s2.UpsertAsset(asset("A2", "room", Good, InService))
	s2.DecommissionAsset("A2")
	if _, err := s2.ReturnAssetToService("A2", ""); err == nil {
		t.Fatal("a decommissioned asset cannot return to service")
	}
	// invalid condition rejected.
	if _, err := s.ReturnAssetToService("A1", "pristine"); err == nil {
		t.Fatal("invalid condition rejected")
	}
}

func TestListsFiltersAndCounts(t *testing.T) {
	s := NewStore()
	s.UpsertAsset(asset("A1", "room", Good, InService))
	s.UpsertAsset(asset("A2", "ict", Poor, InService))
	s.RaiseTicket(ticket("T1", "A1", SevLow))
	s.RaiseTicket(ticket("T2", "A2", SevHigh))
	if len(s.ListAssets(AssetFilter{Category: "ict"})) != 1 {
		t.Fatal("asset category filter wrong")
	}
	if len(s.ListAssets(AssetFilter{Condition: Good})) != 1 {
		t.Fatal("asset condition filter wrong")
	}
	if len(s.ListTickets(TicketFilter{Severity: SevHigh})) != 1 {
		t.Fatal("ticket severity filter wrong")
	}
	if len(s.ListTickets(TicketFilter{AssetID: "A1"})) != 1 {
		t.Fatal("ticket asset filter wrong")
	}
	if OpenTicketCount(s.ListTickets(TicketFilter{}), "A1") != 1 {
		t.Fatal("open ticket count wrong")
	}
	if s.CountAssets() != 2 {
		t.Fatalf("count wrong: %d", s.CountAssets())
	}
	if _, ok := s.GetTicket("T1"); !ok {
		t.Fatal("get ticket failed")
	}
}
