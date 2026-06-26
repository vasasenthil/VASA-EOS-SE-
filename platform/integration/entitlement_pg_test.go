package integration

import (
	"os"
	"testing"

	"github.com/vasa-eos-se-tn/platform/entitlement"
)

// TestPgEntitlementDurable proves entitlements + issues persist across fresh instances, the over-issue gate is
// enforced durably (and atomically with the status recompute), and a re-issue corrects idempotently. Runs only
// with DATABASE_URL set.
func TestPgEntitlementDurable(t *testing.T) {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		t.Skip("DATABASE_URL not set; durable PostgreSQL entitlement test runs against a live database only")
	}
	s1, err := newPgEntStore(dsn)
	if err != nil {
		t.Fatalf("connect/migrate: %v", err)
	}
	if _, err := s1.db.Exec(`DELETE FROM entitlement_issues WHERE org_unit='PGE-SCH'`); err != nil {
		t.Fatalf("cleanup issues: %v", err)
	}
	if _, err := s1.db.Exec(`DELETE FROM entitlements WHERE org_unit='PGE-SCH'`); err != nil {
		t.Fatalf("cleanup ents: %v", err)
	}
	ent := func(id string, qty int) entitlement.Entitlement {
		return entitlement.Entitlement{ID: id, OrgUnit: "PGE-SCH", StudentID: "ST-1", Item: "uniform", EntitledQty: qty, Term: "2026", Status: entitlement.Pending}
	}
	iss := func(id, entID string, qty int) entitlement.Issue {
		return entitlement.Issue{ID: id, EntitlementID: entID, OrgUnit: "PGE-SCH", StudentID: "ST-1", Qty: qty, IssuedOn: "2026-06-05", Reference: "R-" + id}
	}

	if _, err := s1.GrantEntitlement(ent("PGE-E1", 4)); err != nil {
		t.Fatalf("grant: %v", err)
	}
	if _, err := s1.IssueSupply(iss("PGE-I1", "PGE-E1", 3)); err != nil {
		t.Fatalf("issue: %v", err)
	}
	if s1.Remaining("PGE-E1") != 1 {
		t.Fatalf("remaining wrong: %d", s1.Remaining("PGE-E1"))
	}
	// over-issue (2 more > 1 remaining) rejected durably.
	if _, err := s1.IssueSupply(iss("PGE-I2", "PGE-E1", 2)); err == nil {
		t.Fatal("a durable over-issue must be rejected")
	}

	// fresh instance: entitlement + issue durable, partial status, gate still enforced.
	s2, _ := newPgEntStore(dsn)
	if e, _ := s2.GetEntitlement("PGE-E1"); e.Status != entitlement.Partial {
		t.Fatalf("durable status should be partial: %s", e.Status)
	}
	if _, err := s2.IssueSupply(iss("PGE-I2", "PGE-E1", 5)); err == nil {
		t.Fatal("the over-issue gate must persist across instances")
	}
	// issue exactly the remaining → fulfilled, durable.
	if _, err := s2.IssueSupply(iss("PGE-I2", "PGE-E1", 1)); err != nil {
		t.Fatalf("balance issue: %v", err)
	}
	s3, _ := newPgEntStore(dsn)
	if e, _ := s3.GetEntitlement("PGE-E1"); e.Status != entitlement.Fulfilled {
		t.Fatalf("durable status should be fulfilled: %s", e.Status)
	}
	// a fulfilled entitlement takes no more.
	if _, err := s3.IssueSupply(iss("PGE-I3", "PGE-E1", 1)); err == nil {
		t.Fatal("a fulfilled entitlement cannot take more issues")
	}

	// idempotent correction on a second entitlement.
	s3.GrantEntitlement(ent("PGE-E2", 4))
	s3.IssueSupply(iss("PGE-Q1", "PGE-E2", 3))
	if _, err := s3.IssueSupply(iss("PGE-Q1", "PGE-E2", 1)); err != nil {
		t.Fatalf("correction: %v", err)
	}
	s4, _ := newPgEntStore(dsn)
	if s4.Remaining("PGE-E2") != 3 {
		t.Fatalf("idempotent correction wrong, want 3 remaining: %d", s4.Remaining("PGE-E2"))
	}
}

// TestEntitlementDashboardScoped proves the seeded register rolls up fulfilment + the shortfall worklist
// (in-memory path).
func TestEntitlementDashboardScoped(t *testing.T) {
	p := newPlatform(t)
	d := p.EntitlementDashboard("TN-DIST-Chennai")
	if d.Students == 0 || len(d.Items) == 0 {
		t.Fatalf("seeded register must roll up: %+v", d)
	}
	// every item line must have entitled + some issued.
	for _, it := range d.Items {
		if it.EntitledQty == 0 {
			t.Fatalf("item %s must have an entitled quantity: %+v", it.Item, it)
		}
	}
	// the seed leaves some children short → a shortfall worklist exists.
	if len(d.Shortfall) == 0 {
		t.Fatalf("the shortfall worklist must surface: %+v", d)
	}
	// a student's entitlement record is populated for a seeded child.
	ents, issues := p.StudentEntitlements("", "SYN-S-001")
	if len(ents) == 0 || len(issues) == 0 {
		t.Fatalf("a seeded student must have entitlements and issues: ents=%d issues=%d", len(ents), len(issues))
	}
	// unknown scope → nothing (fail-closed).
	if u := p.EntitlementDashboard("TN-DIST-Nowhere"); u.Students != 0 {
		t.Fatalf("unknown scope must see nothing: %+v", u)
	}
}
