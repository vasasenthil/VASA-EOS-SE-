package integration

import "testing"

func TestSovereignConsoleRoleGated(t *testing.T) {
	p := newPlatform(t)
	// a non-super-admin gets an unauthorised, empty console (fail-closed — nothing disclosed).
	denied := p.SovereignConsole("TEACHER")
	if denied.Authorised || denied.TenancyNodes != 0 || denied.AuditRecords != 0 {
		t.Fatalf("a non-super-admin must see nothing: %+v", denied)
	}
	// the sovereign operator sees the whole-platform picture.
	c := p.SovereignConsole("SUPERADMIN")
	if !c.Authorised {
		t.Fatal("SUPERADMIN must be authorised")
	}
	if c.Layers != 12 || c.GovernanceTiers != 7 || c.Engines != 6 || c.Agents != 6 || c.Portals != 13 {
		t.Fatalf("console conformance figures wrong: %+v", c)
	}
	if c.FunctionalModules != 391 || !c.HeadlinesMatch {
		t.Fatalf("console must reflect the 391-module conformance: %+v", c)
	}
	if c.TenancyNodes != 73232 || !c.TenancyValid || c.Schools != 69000 {
		t.Fatalf("console tenancy/estate wrong: nodes=%d valid=%v schools=%d", c.TenancyNodes, c.TenancyValid, c.Schools)
	}
	if c.ModelCardCoverage != 1 || len(c.SLABoard) == 0 {
		t.Fatalf("console must surface the model-card SLA + board: %+v", c)
	}
	if !c.AuditChainIntact || !c.GoLiveReady || c.OffSwitchEngaged {
		t.Fatalf("a healthy platform should be go-live ready with an intact chain: %+v", c)
	}
}

func TestSovereignOffSwitchSuperAdminOnly(t *testing.T) {
	p := newPlatform(t)
	// a non-super-admin cannot engage the kill-switch.
	if _, err := p.SovereignDisable("TEACHER", "R1"); err == nil {
		t.Fatal("a non-super-admin must not be able to engage the off-switch")
	}
	if p.SovereignConsole("SUPERADMIN").OffSwitchEngaged {
		t.Fatal("the off-switch must not have engaged on a denied attempt")
	}
	// the sovereign operator engages it → the console reflects it + the platform is no longer go-live ready.
	if ok, err := p.SovereignDisable("SECRETARY", "R2"); err != nil || !ok {
		t.Fatalf("the secretary should be able to engage the off-switch: ok=%v err=%v", ok, err)
	}
	c := p.SovereignConsole("SUPERADMIN")
	if !c.OffSwitchEngaged || c.GoLiveReady {
		t.Fatalf("after engaging, the console must show disabled + not-ready: %+v", c)
	}
	// and disengage to restore.
	if ok, _ := p.SovereignEnable("MINISTER", "R3"); !ok {
		t.Fatal("the minister should be able to disengage the off-switch")
	}
	if p.SovereignConsole("SUPERADMIN").OffSwitchEngaged {
		t.Fatal("the platform must be re-enabled after disengage")
	}
}
