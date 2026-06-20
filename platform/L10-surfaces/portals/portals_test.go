package portals

import "testing"

func TestThirteenPortals(t *testing.T) {
	ps := Portals()
	if len(ps) != 13 {
		t.Fatalf("expected 13 stakeholder portals, got %d", len(ps))
	}
	seen := map[string]bool{}
	for _, p := range ps {
		if p.Role == "" || p.Home == "" || p.Tier == "" || len(p.Grants) == 0 {
			t.Fatalf("portal incomplete: %+v", p)
		}
		if seen[p.Role] {
			t.Fatalf("duplicate portal role %s", p.Role)
		}
		seen[p.Role] = true
	}
	// the dossier's core roles must be present.
	for _, r := range []string{"STUDENT", "PARENT", "TEACHER", "PRINCIPAL", "BEO", "DEO", "DIRECTOR", "SECRETARY", "PUBLIC"} {
		if !seen[r] {
			t.Fatalf("missing core portal role %s", r)
		}
	}
}

func TestPortalLookupAndTier(t *testing.T) {
	if p, ok := PortalFor("TEACHER"); !ok || p.Home != "/teach" {
		t.Fatalf("teacher portal wrong: %+v ok=%v", p, ok)
	}
	if _, ok := PortalFor("NOPE"); ok {
		t.Fatal("unknown role must not resolve")
	}
	school := ByTier("school")
	if len(school) < 3 {
		t.Fatalf("school tier should host several portals, got %d", len(school))
	}
	if len(Roles()) != 13 {
		t.Fatalf("expected 13 roles, got %d", len(Roles()))
	}
}
