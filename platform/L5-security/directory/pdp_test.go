package directory

import "testing"

// fakeGoverns models downward governance: a subject org governs itself and any target that has it as a prefix
// boundary in this toy tree. We use explicit pairs for clarity.
func fakeGoverns(pairs map[string]map[string]bool) func(string, string) bool {
	return func(subj, target string) bool {
		if subj == target {
			return true
		}
		return pairs[subj][target]
	}
}

func newEngine() *Engine {
	gov := fakeGoverns(map[string]map[string]bool{
		"TN-DIST-Chennai": {"S-CHN-1": true, "S-CHN-2": true},
		"TN":              {"S-CHN-1": true, "S-CHN-2": true, "S-CBE-1": true, "TN-DIST-Chennai": true},
	})
	return NewEngine(gov)
}

func TestRBACGrantAndDeny(t *testing.T) {
	e := newEngine()
	teacher := User{ID: "t1", Role: "TEACHER", OrgUnit: "S-CHN-1", Attributes: map[string]string{"cadre": "teaching"}}
	// RBAC permit (in jurisdiction).
	if d := e.Evaluate(teacher, "write:assessment", Resource{OrgUnit: "S-CHN-1"}, Context{}); !d.Permitted() {
		t.Fatalf("teacher should write assessment in own school: %+v", d)
	}
	// RBAC deny — a teacher cannot release funds.
	d := e.Evaluate(teacher, "release:fund", Resource{}, Context{})
	if d.Effect != "deny" || d.DecidingModel != "RBAC" {
		t.Fatalf("teacher must be denied fund release by RBAC: %+v", d)
	}
}

func TestReBACJurisdictionGate(t *testing.T) {
	e := newEngine()
	deo := User{ID: "d1", Role: "DEO", OrgUnit: "TN-DIST-Chennai"}
	// in-jurisdiction school → permit.
	if d := e.Evaluate(deo, "read:school", Resource{OrgUnit: "S-CHN-1"}, Context{}); !d.Permitted() {
		t.Fatalf("DEO should read a school in their district: %+v", d)
	}
	// out-of-jurisdiction school → ReBAC deny even though RBAC grants read:school.
	d := e.Evaluate(deo, "read:school", Resource{OrgUnit: "S-CBE-1"}, Context{})
	if d.Effect != "deny" || d.DecidingModel != "ReBAC" {
		t.Fatalf("DEO must be denied a school outside their district by ReBAC: %+v", d)
	}
}

func TestABACSuspendedAndCadre(t *testing.T) {
	e := newEngine()
	// suspended subject is denied regardless of role grant.
	susp := User{ID: "h1", Role: "HEAD_TEACHER", OrgUnit: "S-CHN-1", Suspended: true, Attributes: map[string]string{"cadre": "teaching"}}
	if d := e.Evaluate(susp, "read:school", Resource{OrgUnit: "S-CHN-1"}, Context{}); d.Effect != "deny" || d.DecidingModel != "ABAC" {
		t.Fatalf("suspended subject must be denied by ABAC: %+v", d)
	}
	// non-teaching cadre cannot enter marks (ABAC cadre gate), even with the RBAC grant.
	admin := User{ID: "h2", Role: "HEAD_TEACHER", OrgUnit: "S-CHN-1", Attributes: map[string]string{"cadre": "administrative"}}
	if d := e.Evaluate(admin, "write:assessment", Resource{OrgUnit: "S-CHN-1"}, Context{}); d.Effect != "deny" || d.DecidingModel != "ABAC" {
		t.Fatalf("non-teaching cadre must be denied marks entry by ABAC: %+v", d)
	}
}

func TestABACSensitiveAndPII(t *testing.T) {
	e := newEngine()
	citizen := User{ID: "c1", Role: "CITIZEN", OrgUnit: "TN"}
	if d := e.Evaluate(citizen, "read:public", Resource{Attributes: map[string]string{"sensitive": "true"}}, Context{}); d.Effect != "deny" || d.DecidingModel != "ABAC" {
		t.Fatalf("citizen must be denied a sensitive resource by ABAC: %+v", d)
	}
	researcher := User{ID: "r1", Role: "RESEARCHER", OrgUnit: "TN"}
	if d := e.Evaluate(researcher, "read:analytics", Resource{Attributes: map[string]string{"pii": "true"}}, Context{}); d.Effect != "deny" {
		t.Fatalf("researcher must be denied raw PII: %+v", d)
	}
}

func TestPBACHighStakesRequiresApproval(t *testing.T) {
	e := newEngine()
	sec := User{ID: "s1", Role: "SECRETARY", OrgUnit: "TN-SEC"}
	// RBAC grants release:fund, but PBAC routes it to human approval — never a silent permit.
	d := e.Evaluate(sec, "release:fund", Resource{}, Context{})
	if d.Effect != "require-approval" || d.DecidingModel != "PBAC" {
		t.Fatalf("fund release must be PBAC require-approval: %+v", d)
	}
}

func TestCABACElevationWindow(t *testing.T) {
	e := newEngine()
	minister := User{ID: "m1", Role: "MINISTER", OrgUnit: "TN"}
	// outside an emergency, the elevated action is denied by CABAC even for the minister.
	if d := e.Evaluate(minister, "declare:emergency", Resource{}, Context{}); d.Effect != "deny" || d.DecidingModel != "CABAC" {
		t.Fatalf("elevated action must be denied outside the emergency window: %+v", d)
	}
	// inside the emergency window (and not high threat) it is permitted by CABAC.
	if d := e.Evaluate(minister, "declare:emergency", Resource{}, Context{Emergency: true, ThreatLevel: "low"}); !d.Permitted() || d.DecidingModel != "CABAC" {
		t.Fatalf("elevated action must be permitted inside the emergency window: %+v", d)
	}
	// a teacher is never entitled to the elevated action, even in an emergency (RBAC gate).
	teacher := User{ID: "t9", Role: "TEACHER", OrgUnit: "S-CHN-1", Attributes: map[string]string{"cadre": "teaching"}}
	if d := e.Evaluate(teacher, "declare:emergency", Resource{}, Context{Emergency: true}); d.Effect != "deny" || d.DecidingModel != "RBAC" {
		t.Fatalf("an unentitled role must be denied the elevated action by RBAC: %+v", d)
	}
}

func TestDecisionTraceCoversAllFiveModels(t *testing.T) {
	e := newEngine()
	deo := User{ID: "d2", Role: "DEO", OrgUnit: "TN-DIST-Chennai"}
	d := e.Evaluate(deo, "read:school", Resource{OrgUnit: "S-CHN-1"}, Context{})
	models := map[string]bool{}
	for _, ev := range d.Trace {
		models[ev.Model] = true
	}
	for _, m := range []string{"RBAC", "ABAC", "ReBAC", "PBAC", "CABAC"} {
		if !models[m] {
			t.Fatalf("the decision trace must include %s: %+v", m, d.Trace)
		}
	}
}

func TestExplainByUser(t *testing.T) {
	e := newEngine()
	dir := NewDirectory()
	dir.Upsert(User{ID: "u-deo", Role: "DEO", OrgUnit: "TN-DIST-Chennai"})
	dec, u, ok := e.Explain(dir, "u-deo", "read:school", Resource{OrgUnit: "S-CHN-1"}, Context{})
	if !ok || u.Role != "DEO" || !dec.Permitted() {
		t.Fatalf("explain-by-user should resolve and permit: ok=%v user=%+v dec=%+v", ok, u, dec)
	}
	if _, _, ok := e.Explain(dir, "nobody", "read:school", Resource{}, Context{}); ok {
		t.Fatal("explain for an unknown user must report not-found")
	}
}
