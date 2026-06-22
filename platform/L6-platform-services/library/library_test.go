package library

import "testing"

func mustIssue(t *testing.T, s *Store, id, copyID, member string) Loan {
	t.Helper()
	l, err := NewLoan(id, "LIB1", "BK-1", "Ponniyin Selvan", copyID, member, "2026-06-01")
	if err != nil {
		t.Fatalf("new loan: %v", err)
	}
	out, err := s.Issue(l)
	if err != nil {
		t.Fatalf("issue: %v", err)
	}
	return out
}

func TestNewLoanComputesDueAndValidates(t *testing.T) {
	l, err := NewLoan("L1", "LIB1", "BK-1", "Title", "CP-1", "SYN-S-01", "2026-06-01")
	if err != nil {
		t.Fatalf("new loan: %v", err)
	}
	if l.DueOn != "2026-06-15" { // +14 days
		t.Fatalf("due date wrong: %s", l.DueOn)
	}
	if l.Status != OnLoan {
		t.Fatalf("new loan must be on_loan: %s", l.Status)
	}
	if _, err := NewLoan("L1", "LIB1", "BK-1", "Title", "CP-1", "SYN-S-01", "nope"); err == nil {
		t.Fatal("invalid issue date must be rejected")
	}
	if _, err := NewLoan("", "LIB1", "BK-1", "Title", "CP-1", "SYN-S-01", "2026-06-01"); err == nil {
		t.Fatal("missing id must be rejected")
	}
}

func TestCopyCannotBeOnLoanTwice(t *testing.T) {
	s := NewStore()
	mustIssue(t, s, "L1", "CP-1", "SYN-S-01")
	// the SAME physical copy issued to a DIFFERENT member while still out → rejected.
	l2, _ := NewLoan("L2", "LIB1", "BK-1", "T", "CP-1", "SYN-S-02", "2026-06-02")
	if _, err := s.Issue(l2); err == nil {
		t.Fatal("a copy already on loan cannot be issued again")
	}
	// a different copy of the same book is fine.
	if _, err := s.Issue(mustNew(t, "L3", "CP-2", "SYN-S-02")); err != nil {
		t.Fatalf("a different copy must be issuable: %v", err)
	}
	// once returned, the copy is free to re-issue.
	if _, err := s.Return("L1", "2026-06-05"); err != nil {
		t.Fatalf("return: %v", err)
	}
	if _, err := s.Issue(mustNew(t, "L4", "CP-1", "SYN-S-03")); err != nil {
		t.Fatalf("a returned copy must be re-issuable: %v", err)
	}
}

func mustNew(t *testing.T, id, copyID, member string) Loan {
	t.Helper()
	l, err := NewLoan(id, "LIB1", "BK-1", "Ponniyin Selvan", copyID, member, "2026-06-02")
	if err != nil {
		t.Fatalf("new loan: %v", err)
	}
	return l
}

func TestRenewRespectsLimitAndExtendsDue(t *testing.T) {
	s := NewStore()
	mustIssue(t, s, "L1", "CP-1", "SYN-S-01") // due 2026-06-15
	r1, err := s.Renew("L1")
	if err != nil || r1.DueOn != "2026-06-29" || r1.Renewals != 1 {
		t.Fatalf("first renew wrong: %+v err=%v", r1, err)
	}
	r2, _ := s.Renew("L1")
	if r2.Renewals != 2 || r2.DueOn != "2026-07-13" {
		t.Fatalf("second renew wrong: %+v", r2)
	}
	// third renewal exceeds the cap.
	if _, err := s.Renew("L1"); err == nil {
		t.Fatal("renewal limit must be enforced")
	}
	// a returned loan cannot be renewed.
	s.Issue(mustNew(t, "L2", "CP-2", "SYN-S-02"))
	s.Return("L2", "2026-06-10")
	if _, err := s.Renew("L2"); err == nil {
		t.Fatal("a returned loan cannot be renewed")
	}
}

func TestLostAndOverdueAnalytics(t *testing.T) {
	s := NewStore()
	mustIssue(t, s, "L1", "CP-1", "SYN-S-01") // due 2026-06-15
	mustIssue(t, s, "L2", "CP-2", "SYN-S-02") // due 2026-06-15
	// as of 2026-06-20 both are overdue.
	if OverdueCount(s.List(Filter{}), "2026-06-20") != 2 {
		t.Fatal("both on-loan copies should be overdue")
	}
	// return one, lose one → none on loan, none overdue.
	if _, err := s.Return("L1", "2026-06-14"); err != nil {
		t.Fatalf("return: %v", err)
	}
	lost, err := s.MarkLost("L2")
	if err != nil || lost.Status != Lost {
		t.Fatalf("mark lost: %+v err=%v", lost, err)
	}
	if OverdueCount(s.List(Filter{}), "2026-06-20") != 0 {
		t.Fatal("returned/lost copies are not overdue")
	}
	// a lost copy cannot be returned.
	if _, err := s.Return("L2", "2026-06-21"); err == nil {
		t.Fatal("a lost copy cannot be returned")
	}
	// unknown ids fail.
	if _, err := s.Return("ZZ", "2026-06-21"); err == nil {
		t.Fatal("unknown loan must fail")
	}
}

func TestListFilterAndCount(t *testing.T) {
	s := NewStore()
	mustIssue(t, s, "L1", "CP-1", "SYN-S-01")
	mustIssue(t, s, "L2", "CP-2", "SYN-S-01")
	mustIssue(t, s, "L3", "CP-3", "SYN-S-02")
	if got := s.List(Filter{Member: "SYN-S-01"}); len(got) != 2 {
		t.Fatalf("member filter wrong: %d", len(got))
	}
	if got := s.List(Filter{Status: OnLoan}); len(got) != 3 {
		t.Fatalf("status filter wrong: %d", len(got))
	}
	if s.Count() != 3 {
		t.Fatalf("count wrong: %d", s.Count())
	}
	if g, ok := s.Get("L2"); !ok || g.CopyID != "CP-2" {
		t.Fatalf("get wrong: %+v", g)
	}
}
