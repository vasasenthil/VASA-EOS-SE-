package integration

import (
	"os"
	"testing"

	"github.com/vasa-eos-se-tn/platform/library"
)

// TestPgLibraryDurable proves loans persist across fresh store instances, the one-copy-one-borrower invariant
// is enforced durably, and the return → re-issue cycle frees a copy. Runs only with DATABASE_URL set.
func TestPgLibraryDurable(t *testing.T) {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		t.Skip("DATABASE_URL not set; durable PostgreSQL library test runs against a live database only")
	}
	s1, err := newPgLibStore(dsn)
	if err != nil {
		t.Fatalf("connect/migrate: %v", err)
	}
	if _, err := s1.db.Exec(`DELETE FROM library_loans WHERE org_unit='PGL-LIB'`); err != nil {
		t.Fatalf("cleanup: %v", err)
	}
	ln := func(id, copyID, member, issued string) library.Loan {
		l, err := library.NewLoan(id, "PGL-LIB", "BK-1", "Title", copyID, member, issued)
		if err != nil {
			t.Fatalf("new loan: %v", err)
		}
		return l
	}

	if _, err := s1.Issue(ln("PGL-1", "CP-1", "M-1", "2026-05-01")); err != nil {
		t.Fatalf("issue: %v", err)
	}
	// the same physical copy issued to another member while out → rejected (durable invariant).
	if _, err := s1.Issue(ln("PGL-2", "CP-1", "M-2", "2026-05-02")); err == nil {
		t.Fatal("a durable copy clash must be rejected")
	}

	// fresh instance: loan durable, clash still enforced.
	s2, _ := newPgLibStore(dsn)
	if g, ok := s2.Get("PGL-1"); !ok || g.MemberID != "M-1" || g.DueOn != "2026-05-15" {
		t.Fatalf("loan not durable: %+v", g)
	}
	if _, err := s2.Issue(ln("PGL-3", "CP-1", "M-3", "2026-05-03")); err == nil {
		t.Fatal("clash must persist across instances")
	}
	// renew (durable), then return frees the copy.
	if r, err := s2.Renew("PGL-1"); err != nil || r.DueOn != "2026-05-29" || r.Renewals != 1 {
		t.Fatalf("renew: %+v err=%v", r, err)
	}
	if _, err := s2.Return("PGL-1", "2026-05-20"); err != nil {
		t.Fatalf("return: %v", err)
	}
	// fresh instance: the copy is free to re-issue, and the return persisted.
	s3, _ := newPgLibStore(dsn)
	if g, _ := s3.Get("PGL-1"); g.Status != library.Returned || g.ReturnedOn != "2026-05-20" {
		t.Fatalf("return not durable: %+v", g)
	}
	if _, err := s3.Issue(ln("PGL-4", "CP-1", "M-4", "2026-05-21")); err != nil {
		t.Fatalf("a returned copy must be re-issuable durably: %v", err)
	}
	// mark a copy lost (durable).
	if l, err := s3.MarkLost("PGL-4"); err != nil || l.Status != library.Lost {
		t.Fatalf("mark lost: %+v err=%v", l, err)
	}
	s4, _ := newPgLibStore(dsn)
	if g, _ := s4.Get("PGL-4"); g.Status != library.Lost {
		t.Fatalf("lost not durable: %+v", g)
	}
}

// TestLibraryDashboardScoped proves the seeded circulation rolls up + computes the overdue picture (in-memory).
func TestLibraryDashboardScoped(t *testing.T) {
	p := newPlatform(t)
	d := p.LibraryDashboard("TN-DIST-Chennai")
	if d.ActiveLoans == 0 || d.Members == 0 || d.Titles == 0 {
		t.Fatalf("seeded circulation must roll up: %+v", d)
	}
	// two seeded loans were issued in May → overdue against today's date (2026-06+).
	if d.Overdue < 2 {
		t.Fatalf("seeded overdue loans must surface: %+v", d)
	}
	// a member's history is non-empty for a seeded borrower.
	if len(p.MemberLoans("SYN-S-001")) == 0 {
		t.Fatal("a seeded member must have a loan history")
	}
	// unknown scope → nothing (fail-closed).
	if u := p.LibraryDashboard("TN-DIST-Nowhere"); u.ActiveLoans != 0 {
		t.Fatalf("unknown scope must see nothing: %+v", u)
	}
}
