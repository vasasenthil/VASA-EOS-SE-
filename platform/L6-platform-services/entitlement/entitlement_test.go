package entitlement

import "testing"

func ent(id string, qty int) Entitlement {
	return Entitlement{ID: id, OrgUnit: "SCH1", StudentID: "SYN-S-1", Item: "uniform", EntitledQty: qty, Term: "2026", Status: Pending}
}

func iss(id, entID string, qty int) Issue {
	return Issue{ID: id, EntitlementID: entID, OrgUnit: "SCH1", StudentID: "SYN-S-1", Qty: qty, IssuedOn: "2026-06-10", Reference: "REF-" + id}
}

func TestGrantValidation(t *testing.T) {
	s := NewStore()
	if _, err := s.GrantEntitlement(ent("E1", 0)); err == nil {
		t.Fatal("zero quantity rejected")
	}
	if _, err := s.GrantEntitlement(Entitlement{ID: "E1", OrgUnit: "SCH1", StudentID: "S1", Item: "", EntitledQty: 4, Status: Pending}); err == nil {
		t.Fatal("missing item rejected")
	}
	if _, err := s.GrantEntitlement(ent("E1", 4)); err != nil {
		t.Fatalf("valid grant: %v", err)
	}
}

func TestIssueDrawsDownAndStatus(t *testing.T) {
	s := NewStore()
	s.GrantEntitlement(ent("E1", 4)) // 4 uniform sets
	if _, err := s.IssueSupply(iss("I1", "E1", 2)); err != nil {
		t.Fatalf("part issue: %v", err)
	}
	if e, _ := s.GetEntitlement("E1"); e.Status != Partial {
		t.Fatalf("status should be partial: %s", e.Status)
	}
	if s.Remaining("E1") != 2 {
		t.Fatalf("remaining should be 2: %d", s.Remaining("E1"))
	}
	if _, err := s.IssueSupply(iss("I2", "E1", 2)); err != nil {
		t.Fatalf("final issue: %v", err)
	}
	if e, _ := s.GetEntitlement("E1"); e.Status != Fulfilled {
		t.Fatalf("status should be fulfilled: %s", e.Status)
	}
	if s.Remaining("E1") != 0 {
		t.Fatalf("remaining should be 0: %d", s.Remaining("E1"))
	}
}

func TestNoOverIssue(t *testing.T) {
	s := NewStore()
	s.GrantEntitlement(ent("E1", 4))
	s.IssueSupply(iss("I1", "E1", 3))
	// issuing 2 more (total 5 > 4) is rejected.
	if _, err := s.IssueSupply(iss("I2", "E1", 2)); err == nil {
		t.Fatal("an over-issue must be rejected")
	}
	// the rejected issue must not have been recorded.
	if IssuedSoFar(s.ListIssues(IssueFilter{}), "E1", "") != 3 {
		t.Fatalf("rejected issue must not be recorded: %d", IssuedSoFar(s.ListIssues(IssueFilter{}), "E1", ""))
	}
	// issuing exactly the remaining is fine.
	if _, err := s.IssueSupply(iss("I2", "E1", 1)); err != nil {
		t.Fatalf("exact remaining issue: %v", err)
	}
	// a fulfilled entitlement takes no more.
	if _, err := s.IssueSupply(iss("I3", "E1", 1)); err == nil {
		t.Fatal("a fulfilled entitlement cannot take more issues")
	}
}

func TestIssueIdempotentCorrection(t *testing.T) {
	s := NewStore()
	s.GrantEntitlement(ent("E1", 4))
	s.IssueSupply(iss("I1", "E1", 3))
	// correct I1 down to 1 — recompute, do not double-count.
	if _, err := s.IssueSupply(iss("I1", "E1", 1)); err != nil {
		t.Fatalf("correction: %v", err)
	}
	if got := IssuedSoFar(s.ListIssues(IssueFilter{}), "E1", ""); got != 1 {
		t.Fatalf("idempotent correction wrong, want 1: %d", got)
	}
	if e, _ := s.GetEntitlement("E1"); e.Status != Partial {
		t.Fatalf("status should be partial after correction: %s", e.Status)
	}
}

func TestIssueGuards(t *testing.T) {
	s := NewStore()
	// issue against unknown entitlement.
	if _, err := s.IssueSupply(iss("I1", "GHOST", 1)); err == nil {
		t.Fatal("issue against unknown entitlement must fail")
	}
	// cancelled entitlement takes no issues.
	s.GrantEntitlement(Entitlement{ID: "E1", OrgUnit: "SCH1", StudentID: "S1", Item: "bag", EntitledQty: 1, Term: "2026", Status: Cancelled})
	if _, err := s.IssueSupply(iss("I1", "E1", 1)); err == nil {
		t.Fatal("a cancelled entitlement takes no issues")
	}
}

func TestListsFiltersAndCounts(t *testing.T) {
	s := NewStore()
	s.GrantEntitlement(ent("E1", 4))
	s.GrantEntitlement(Entitlement{ID: "E2", OrgUnit: "SCH1", StudentID: "SYN-S-2", Item: "textbook", EntitledQty: 10, Term: "2026", Status: Pending})
	s.IssueSupply(iss("I1", "E1", 2))
	if len(s.ListEntitlements(EntitlementFilter{Item: "textbook"})) != 1 {
		t.Fatal("item filter wrong")
	}
	if len(s.ListEntitlements(EntitlementFilter{Status: Partial})) != 1 {
		t.Fatal("status filter wrong")
	}
	if len(s.ListIssues(IssueFilter{EntitlementID: "E1"})) != 1 {
		t.Fatal("issue entitlement filter wrong")
	}
	if s.CountEntitlements() != 2 {
		t.Fatalf("count wrong: %d", s.CountEntitlements())
	}
}
