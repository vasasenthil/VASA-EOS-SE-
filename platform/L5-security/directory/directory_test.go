package directory

import "testing"

func TestRoleCatalogueCoversTheHierarchy(t *testing.T) {
	roles := Roles()
	if len(roles) < 18 {
		t.Fatalf("expected the full governance-hierarchy role catalogue, got %d", len(roles))
	}
	idx := roleIndex()
	// every category from learner (T6) to sovereign (T0) plus assurance/citizen/partner must be present.
	for _, code := range []string{
		"STUDENT", "PARENT", "TEACHER", "HEAD_TEACHER", "CRC_COORDINATOR", "BEO", "DEO", "CEO",
		"DIRECTOR", "SECRETARY", "MINISTER", "SUPERADMIN", "AUDITOR", "ETHICS_CHAIR", "ARCHITECT",
		"PIO", "CITIZEN", "VENDOR", "RESEARCHER",
	} {
		r, ok := idx[code]
		if !ok {
			t.Fatalf("role %s missing from the catalogue", code)
		}
		if r.Tier == "" || len(r.Grants) == 0 {
			t.Fatalf("role %s must declare a tier anchor and grants: %+v", code, r)
		}
	}
	// SUPERADMIN holds the wildcard; STUDENT must not.
	if idx["SUPERADMIN"].Grants[0] != "*" {
		t.Fatal("SUPERADMIN must hold the wildcard grant")
	}
	for _, g := range idx["STUDENT"].Grants {
		if g == "*" {
			t.Fatal("STUDENT must never hold the wildcard")
		}
	}
}

func TestDirectoryStoreAndRollups(t *testing.T) {
	d := NewDirectory()
	d.Upsert(User{ID: "u1", Name: "A", Role: "TEACHER", OrgUnit: "S1"})
	d.Upsert(User{ID: "u2", Name: "B", Role: "TEACHER", OrgUnit: "S1"})
	d.Upsert(User{ID: "u3", Name: "C", Role: "DEO", OrgUnit: "TN-DIST-Chennai"})
	if d.Count() != 3 {
		t.Fatalf("expected 3 users, got %d", d.Count())
	}
	// upsert is idempotent on ID (update, not duplicate).
	d.Upsert(User{ID: "u1", Name: "A2", Role: "HEAD_TEACHER", OrgUnit: "S1"})
	if d.Count() != 3 {
		t.Fatalf("upsert must update in place: %d", d.Count())
	}
	if u, _ := d.Get("u1"); u.Name != "A2" || u.Role != "HEAD_TEACHER" {
		t.Fatalf("upsert did not update: %+v", u)
	}
	if len(d.ByRole("TEACHER")) != 1 || len(d.ByOrg("S1")) != 2 {
		t.Fatalf("rollup wrong: byRole=%d byOrg=%d", len(d.ByRole("TEACHER")), len(d.ByOrg("S1")))
	}
	if d.RoleCounts()["TEACHER"] != 1 || d.RoleCounts()["HEAD_TEACHER"] != 1 {
		t.Fatalf("role counts wrong: %+v", d.RoleCounts())
	}
}
