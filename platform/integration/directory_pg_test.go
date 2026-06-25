package integration

import (
	"os"
	"testing"

	"github.com/vasa-eos-se-tn/platform/directory"
)

// TestPgDirectoryDurable proves the user directory persists to PostgreSQL and that the unified five-model PDP
// decides correctly over PERSISTED users (loaded from a fresh store instance). Runs only with DATABASE_URL set.
func TestPgDirectoryDurable(t *testing.T) {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		t.Skip("DATABASE_URL not set; durable PostgreSQL directory test runs against a live database only")
	}
	d1, err := newPgUserDirectory(dsn)
	if err != nil {
		t.Fatalf("connect/migrate: %v", err)
	}
	if _, err := d1.db.Exec(`DELETE FROM directory_users WHERE id LIKE 'PGU-%'`); err != nil {
		t.Fatalf("cleanup: %v", err)
	}
	// the durable stores are shared singletons keyed by DATABASE_URL, so this test's rows live in the same
	// directory_users table every other test reads. Remove them when we finish, otherwise PGU-TCH (anchored to
	// the out-of-tree node S-CHN-1) leaks into TestDirectoryScopedByDownwardGovernance and makes its global
	// "TN sees every user" count flake (20 of 21) depending on test order.
	t.Cleanup(func() { _, _ = d1.db.Exec(`DELETE FROM directory_users WHERE id LIKE 'PGU-%'`) })

	// upsert a teaching-cadre teacher + a DEO, both bound to org units.
	d1.Upsert(directory.User{ID: "PGU-TCH", Name: "R. Kumar", Role: "TEACHER", OrgUnit: "S-CHN-1", Attributes: map[string]string{"cadre": "teaching"}})
	d1.Upsert(directory.User{ID: "PGU-DEO", Name: "S. Devi", Role: "DEO", OrgUnit: "TN-DIST-Chennai"})
	// idempotent update (no duplicate, role changes).
	d1.Upsert(directory.User{ID: "PGU-TCH", Name: "R. Kumar", Role: "HEAD_TEACHER", OrgUnit: "S-CHN-1", Attributes: map[string]string{"cadre": "teaching"}})

	// fresh instance reads the persisted users.
	d2, _ := newPgUserDirectory(dsn)
	u, ok := d2.Get("PGU-TCH")
	if !ok || u.Role != "HEAD_TEACHER" || u.Attributes["cadre"] != "teaching" {
		t.Fatalf("user not durable / not updated: %+v ok=%v", u, ok)
	}
	// rollups are over the shared table; assert on this test's own org unit + that DEO is counted.
	if len(d2.ByOrg("S-CHN-1")) != 1 || d2.RoleCounts()["DEO"] < 1 {
		t.Fatalf("rollups wrong: byOrg=%d census=%+v", len(d2.ByOrg("S-CHN-1")), d2.RoleCounts())
	}

	// the unified PDP decides over a PERSISTED user, with a real Governs predicate.
	gov := func(subj, target string) bool {
		return subj == target || (subj == "TN-DIST-Chennai" && target == "S-CHN-1")
	}
	e := directory.NewEngine(gov)
	deo, _ := d2.Get("PGU-DEO")
	// in-jurisdiction read → permit.
	if dec := e.Evaluate(deo, "read:school", directory.Resource{OrgUnit: "S-CHN-1"}, directory.Context{}); !dec.Permitted() {
		t.Fatalf("persisted DEO should read in-district: %+v", dec)
	}
	// out-of-jurisdiction → ReBAC deny.
	if dec := e.Evaluate(deo, "read:school", directory.Resource{OrgUnit: "S-OTHER"}, directory.Context{}); dec.Effect != "deny" || dec.DecidingModel != "ReBAC" {
		t.Fatalf("persisted DEO out-of-district must be ReBAC-denied: %+v", dec)
	}
	// suspend the teacher durably → ABAC denies regardless of role.
	susp, _ := d2.Get("PGU-TCH")
	susp.Suspended = true
	d2.Upsert(susp)
	d3, _ := newPgUserDirectory(dsn)
	again, _ := d3.Get("PGU-TCH")
	if !again.Suspended {
		t.Fatal("suspension not durable")
	}
	if dec := e.Evaluate(again, "read:school", directory.Resource{OrgUnit: "S-CHN-1"}, directory.Context{}); dec.Effect != "deny" || dec.DecidingModel != "ABAC" {
		t.Fatalf("a durably-suspended user must be ABAC-denied: %+v", dec)
	}
}
