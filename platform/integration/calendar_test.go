package integration

import (
	"testing"

	"github.com/vasa-eos-se-tn/platform/calendar"
)

func TestCalendarSeedScopedAndDateOrdered(t *testing.T) {
	p := newPlatform(t)
	// the sovereign sees the whole academic year; entries are date-ordered.
	all := p.CalendarEntries("TN", "", "")
	if len(all) < 8 {
		t.Fatalf("expected the seeded academic year, got %d", len(all))
	}
	for i := 1; i < len(all); i++ {
		if all[i-1].StartDate > all[i].StartDate {
			t.Fatalf("calendar must be date-ordered: %s before %s", all[i-1].StartDate, all[i].StartDate)
		}
	}
	// filter by type works.
	holidays := p.CalendarEntries("TN", calendar.Holiday, "")
	if len(holidays) == 0 {
		t.Fatal("expected seeded holidays")
	}
	for _, e := range holidays {
		if e.Type != calendar.Holiday {
			t.Fatalf("type filter leaked a %s", e.Type)
		}
	}
	// a district officer sees the state-wide fixtures that apply to them plus their district/school entries,
	// but a school officer never sees another school's; verify downward scoping narrows the set.
	district := p.CalendarEntries("TN-DIST-Chennai", "", "")
	if len(district) == 0 || len(district) >= len(all) {
		t.Fatalf("district scope must be a non-empty strict subset: %d of %d", len(district), len(all))
	}
	// an unknown scope sees nothing (fail-closed).
	if got := p.CalendarEntries("TN-DIST-Nowhere", "", ""); len(got) != 0 {
		t.Fatalf("unknown scope must see nothing: %d", len(got))
	}
}

func TestCalendarDynamicChainDepthByTypeAndScope(t *testing.T) {
	p := newPlatform(t)
	// a state-wide board exam escalates all the way to Cabinet: G4→G3→G2→G1 (4 levels).
	state := p.chainFor(calendar.Exam, "TN")
	if len(state) != 4 || state[0].Tier != "G4" || state[3].Tier != "G1" {
		t.Fatalf("state board exam must escalate G4→G3→G2→G1: %+v", state)
	}
	// a district exam is three levels (G4→G3→G2).
	dist := p.chainFor(calendar.Exam, "TN-DIST-Chennai")
	if len(dist) != 3 {
		t.Fatalf("district exam must be 3 levels: %+v", dist)
	}
	// a school PTM is a single signature.
	school := p.SchoolsGovernedBy("TN-DIST-Chennai").Sample[0]
	ptm := p.chainFor(calendar.PTM, school)
	if len(ptm) != 1 || ptm[0].ApproverRole == "" {
		t.Fatalf("a school PTM must be a single approval: %+v", ptm)
	}
	// a school-local event is within the head teacher's authority — no chain (auto-publish).
	if ev := p.chainFor(calendar.Event, school); len(ev) != 0 {
		t.Fatalf("a school event must need no approval: %+v", ev)
	}
}

func TestCalendarMultiLevelApprovalEndToEnd(t *testing.T) {
	p := newPlatform(t)
	// add a fresh state-wide examination and drive it through the full chain.
	if _, err := p.AddCalendarEntry(CalendarDraft{ID: "T-EXAM", Title: "HSC (Class 12) public examination", Type: calendar.Exam, StartDate: "2027-03-01", EndDate: "2027-03-20", OrgUnit: "TN"}); err != nil {
		t.Fatalf("add failed: %v", err)
	}
	sub, err := p.SubmitCalendarEntry("T-EXAM")
	if err != nil || sub.Status != calendar.Pending || len(sub.Chain) != 4 {
		t.Fatalf("submit must open a 4-level chain: %+v err=%v", sub, err)
	}
	// wrong actor at level 1 is rejected (fail-closed).
	if _, err := p.DecideCalendarEntry("T-EXAM", true, "x", "DIRECTOR", []string{"scheme.approve"}, ""); err == nil {
		t.Fatal("only the G4 DEO may act first")
	}
	steps := []struct{ role, scope string }{
		{"DEO", "scheme.recommend"}, {"DIRECTOR", "scheme.approve"}, {"SECRETARY", "fund.release"}, {"MINISTER", "policy.sanction"},
	}
	for i, st := range steps {
		e, err := p.DecideCalendarEntry("T-EXAM", true, "officer", st.role, []string{st.scope}, "cleared")
		if err != nil {
			t.Fatalf("level %d (%s) failed: %v", i, st.role, err)
		}
		if i < len(steps)-1 && e.Status != calendar.Pending {
			t.Fatalf("entry should remain pending after level %d: %+v", i, e)
		}
	}
	final, _ := calendarState().Get("T-EXAM")
	if !final.Published() {
		t.Fatalf("after all four approvals the exam must be published: %+v", final)
	}
}

func TestCalendarDashboardAndInbox(t *testing.T) {
	p := newPlatform(t)
	// submit the seeded board exam so there is real pending work awaiting the G4 DEO.
	if _, err := p.SubmitCalendarEntry("CAL-EXAM-SSLC"); err != nil {
		t.Fatalf("submit seeded exam: %v", err)
	}
	dash := p.CalendarDashboard("TN", "DEO", "2026-06-15")
	if dash.Total == 0 || dash.Published == 0 {
		t.Fatalf("the dashboard must roll up the year: %+v", dash)
	}
	if dash.PendingApprovals == 0 {
		t.Fatalf("the submitted board exam must show as a pending approval: %+v", dash)
	}
	// the DEO's inbox holds the board exam (its current level is G4 = DEO).
	found := false
	for _, e := range dash.MyInbox {
		if e.ID == "CAL-EXAM-SSLC" {
			found = true
		}
	}
	if !found {
		t.Fatalf("the DEO inbox must hold the board exam awaiting G4: %+v", dash.MyInbox)
	}
	// the minister has nothing at the current level yet.
	if mb := p.CalendarDashboard("TN", "MINISTER", "2026-06-15"); len(mb.MyInbox) != 0 {
		t.Fatalf("the minister has nothing to act on at level 1: %+v", mb.MyInbox)
	}
	// the upcoming feed is published-only and in date order.
	for i := 1; i < len(dash.Upcoming); i++ {
		if dash.Upcoming[i-1].StartDate > dash.Upcoming[i].StartDate {
			t.Fatal("upcoming feed must be date-ordered")
		}
		if !dash.Upcoming[i].Published() {
			t.Fatal("upcoming feed must be published-only")
		}
	}
}
