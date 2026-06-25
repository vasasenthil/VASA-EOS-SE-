package calendar

import (
	"testing"
	"time"
)

func fixedClock() func() time.Time {
	t, _ := time.Parse(time.RFC3339, "2026-06-01T00:00:00Z")
	return func() time.Time { return t }
}

func chain(steps ...ApprovalStep) []ApprovalStep { return steps }

func TestCreateValidationAndCRUD(t *testing.T) {
	s := NewStoreWithClock(fixedClock())
	// bad dates rejected.
	if _, err := s.Create(Entry{ID: "E1", Title: "X", Type: Exam, StartDate: "2026-13-40", EndDate: "2026-01-01", OrgUnit: "TN"}); err == nil {
		t.Fatal("malformed start date must be rejected")
	}
	// end before start rejected.
	if _, err := s.Create(Entry{ID: "E2", Title: "X", Type: Exam, StartDate: "2026-09-10", EndDate: "2026-09-01", OrgUnit: "TN"}); err == nil {
		t.Fatal("end before start must be rejected")
	}
	// invalid type rejected.
	if _, err := s.Create(Entry{ID: "E3", Title: "X", Type: "party", StartDate: "2026-09-01", EndDate: "2026-09-01", OrgUnit: "TN"}); err == nil {
		t.Fatal("invalid type must be rejected")
	}
	// good create.
	e, err := s.Create(Entry{ID: "E4", Title: "Half-yearly exam", Type: Exam, StartDate: "2026-09-15", EndDate: "2026-09-25", OrgUnit: "TN"})
	if err != nil || e.Status != Draft {
		t.Fatalf("good create failed: %+v err=%v", e, err)
	}
	// duplicate id rejected.
	if _, err := s.Create(Entry{ID: "E4", Title: "dup", Type: Term, StartDate: "2026-06-01", EndDate: "2026-06-01", OrgUnit: "TN"}); err == nil {
		t.Fatal("duplicate id must be rejected")
	}
	// update editable while draft.
	if _, err := s.Update("E4", "Half-yearly examination", Exam, "2026-09-15", "2026-09-26", "term I"); err != nil {
		t.Fatalf("draft update should succeed: %v", err)
	}
	// delete.
	if !s.Delete("E4") || s.Count() != 0 {
		t.Fatalf("delete failed: count=%d", s.Count())
	}
}

func TestListFiltersAndDateOrder(t *testing.T) {
	s := NewStoreWithClock(fixedClock())
	mk := func(id, typ, start, year, org string) {
		if _, err := s.Create(Entry{ID: id, Title: id, Type: typ, StartDate: start, EndDate: start, OrgUnit: org, AcademicYear: year}); err != nil {
			t.Fatalf("create %s: %v", id, err)
		}
	}
	mk("c", Holiday, "2026-08-15", "2026-2027", "TN")
	mk("a", Term, "2026-06-01", "2026-2027", "TN")
	mk("b", Exam, "2026-09-15", "2026-2027", "TN")
	mk("d", Event, "2027-01-26", "2026-2027", "S1")
	mk("old", Term, "2025-06-01", "2025-2026", "TN")

	// full list is date-ordered.
	all := s.List(Filter{})
	if len(all) != 5 || all[0].ID != "old" || all[1].ID != "a" || all[4].ID != "d" {
		t.Fatalf("list must be date-ordered: %v", ids(all))
	}
	// filter by type.
	if got := s.List(Filter{Type: Exam}); len(got) != 1 || got[0].ID != "b" {
		t.Fatalf("type filter wrong: %v", ids(got))
	}
	// filter by year.
	if got := s.List(Filter{Year: "2026-2027"}); len(got) != 4 {
		t.Fatalf("year filter wrong: %v", ids(got))
	}
	// filter by org allow-list (scoping).
	if got := s.List(Filter{Orgs: map[string]bool{"S1": true}}); len(got) != 1 || got[0].ID != "d" {
		t.Fatalf("org filter wrong: %v", ids(got))
	}
}

func ids(es []Entry) []string {
	out := make([]string, len(es))
	for i, e := range es {
		out[i] = e.ID
	}
	return out
}

func TestMultiLevelApprovalAdvancesAndPublishes(t *testing.T) {
	s := NewStoreWithClock(fixedClock())
	s.Create(Entry{ID: "X", Title: "State board exam", Type: Exam, StartDate: "2027-03-01", EndDate: "2027-03-30", OrgUnit: "TN"})
	four := chain(
		ApprovalStep{Tier: "G4", ApproverRole: "DEO", RequiredScope: "scheme.recommend"},
		ApprovalStep{Tier: "G3", ApproverRole: "DIRECTOR", RequiredScope: "scheme.approve"},
		ApprovalStep{Tier: "G2", ApproverRole: "SECRETARY", RequiredScope: "fund.release"},
		ApprovalStep{Tier: "G1", ApproverRole: "MINISTER", RequiredScope: "policy.sanction"},
	)
	if e, err := s.Submit("X", four); err != nil || e.Status != Pending || len(e.Chain) != 4 {
		t.Fatalf("submit failed: %+v err=%v", e, err)
	}
	// wrong role at the current level is rejected (fail-closed).
	if _, err := s.Act("X", true, "u1", "DIRECTOR", []string{"scheme.approve"}, ""); err == nil {
		t.Fatal("only the G4 DEO may act first")
	}
	// missing scope rejected.
	if _, err := s.Act("X", true, "u1", "DEO", []string{"wrong"}, ""); err == nil {
		t.Fatal("missing scope must be rejected")
	}
	// walk all four levels.
	for i, st := range []struct{ role, scope string }{
		{"DEO", "scheme.recommend"}, {"DIRECTOR", "scheme.approve"}, {"SECRETARY", "fund.release"}, {"MINISTER", "policy.sanction"},
	} {
		e, err := s.Act("X", true, "u", st.role, []string{st.scope}, "ok")
		if err != nil {
			t.Fatalf("level %d (%s) failed: %v", i, st.role, err)
		}
		if i < 3 && e.Status != Pending {
			t.Fatalf("after level %d the entry should still be pending: %+v", i, e)
		}
	}
	e, _ := s.Get("X")
	if !e.Published() || e.CurrentStep != 4 {
		t.Fatalf("after all four levels the exam must be published: %+v", e)
	}
}

func TestRejectStopsTheChain(t *testing.T) {
	s := NewStoreWithClock(fixedClock())
	s.Create(Entry{ID: "Y", Title: "District exam", Type: Exam, StartDate: "2026-12-01", EndDate: "2026-12-10", OrgUnit: "TN-DIST-Chennai"})
	s.Submit("Y", chain(
		ApprovalStep{Tier: "G4", ApproverRole: "DEO", RequiredScope: "scheme.recommend"},
		ApprovalStep{Tier: "G3", ApproverRole: "DIRECTOR", RequiredScope: "scheme.approve"},
	))
	if _, err := s.Act("Y", false, "u", "DEO", []string{"scheme.recommend"}, "clashes with Pongal"); err != nil {
		t.Fatalf("reject should succeed: %v", err)
	}
	e, _ := s.Get("Y")
	if e.Status != Rejected {
		t.Fatalf("a rejection must stop the chain: %+v", e)
	}
	// a rejected entry can be resubmitted after editing.
	if _, err := s.Update("Y", "District exam (revised)", Exam, "2026-12-05", "2026-12-14", ""); err != nil {
		t.Fatalf("a rejected entry must be editable: %v", err)
	}
}

func TestEmptyChainAutoPublishes(t *testing.T) {
	s := NewStoreWithClock(fixedClock())
	s.Create(Entry{ID: "Z", Title: "Class PTM", Type: PTM, StartDate: "2026-07-10", EndDate: "2026-07-10", OrgUnit: "S1"})
	e, _ := s.Submit("Z", nil)
	if !e.Published() {
		t.Fatalf("a zero-stakes local entry with no chain auto-publishes: %+v", e)
	}
}

func TestSummariseAndPendingInbox(t *testing.T) {
	s := NewStoreWithClock(fixedClock())
	s.Create(Entry{ID: "t1", Title: "Term I", Type: Term, StartDate: "2026-06-01", EndDate: "2026-06-01", OrgUnit: "TN"})
	s.Submit("t1", nil) // published
	s.Create(Entry{ID: "x1", Title: "Exam", Type: Exam, StartDate: "2026-09-15", EndDate: "2026-09-20", OrgUnit: "TN"})
	s.Submit("x1", chain(ApprovalStep{Tier: "G4", ApproverRole: "DEO", RequiredScope: "scheme.recommend"}))

	sum := Summarise(s.List(Filter{}), "2026-06-15", 5)
	if sum.Total != 2 || sum.Published != 1 || sum.PendingApprovals != 1 {
		t.Fatalf("summary wrong: %+v", sum)
	}
	if sum.ByType[Term] != 1 || sum.ByType[Exam] != 1 {
		t.Fatalf("by-type wrong: %+v", sum.ByType)
	}
	// upcoming excludes the June term (before the reference date) and the unpublished exam.
	if len(sum.Upcoming) != 0 {
		t.Fatalf("nothing published is on/after the reference date: %+v", sum.Upcoming)
	}
	// the DEO's approval inbox holds the pending exam.
	inbox := PendingFor(s.List(Filter{}), "DEO")
	if len(inbox) != 1 || inbox[0].ID != "x1" {
		t.Fatalf("DEO inbox wrong: %v", ids(inbox))
	}
	if other := PendingFor(s.List(Filter{}), "MINISTER"); len(other) != 0 {
		t.Fatalf("the minister has nothing at the current level: %v", ids(other))
	}
}
