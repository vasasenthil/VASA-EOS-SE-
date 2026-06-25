package integration

import (
	"fmt"
	"log"
	"os"
	"sync"
	"time"

	"github.com/vasa-eos-se-tn/platform/library"
)

// School Library is an L6 constraint-checked circulation vertical: it issues physical book copies to members
// and enforces that a single copy is never on loan twice, while surfacing the overdue picture a librarian and
// the governing officer need. Durable to PostgreSQL.
var (
	libOnce sync.Once
	libBack libStore
)

// libStore is the persistence port.
type libStore interface {
	Issue(library.Loan) (library.Loan, error)
	Return(id, on string) (library.Loan, error)
	Renew(id string) (library.Loan, error)
	MarkLost(id string) (library.Loan, error)
	Get(id string) (library.Loan, bool)
	List(library.Filter) []library.Loan
}

func libState() libStore {
	libOnce.Do(func() {
		if dsn := os.Getenv("DATABASE_URL"); dsn != "" {
			if pg, err := newPgLibStore(dsn); err == nil {
				libBack = pg
				log.Printf("library: using durable PostgreSQL store (DATABASE_URL set)")
			} else {
				log.Printf("library: DATABASE_URL set but PostgreSQL unavailable (%v); using in-memory", err)
				libBack = library.NewStore()
			}
		} else {
			libBack = library.NewStore()
		}
		seedLibrary(libBack)
	})
	return libBack
}

// seedLibrary plants a small circulation set at a real Chennai school library: a handful of copies issued to
// synthetic members, two of them engineered to be overdue, so the overdue analytics have signal. Synthetic ids.
func seedLibrary(s libStore) {
	// Plant a circulation set at several schools over more than one district. Copy ids are globally unique
	// (one-copy-one-borrower), so each school's copies + loans carry a per-school suffix; school 0 keeps the
	// canonical ids the existing proofs reference.
	schools := pilotSchools(4)
	if len(schools) == 0 {
		if only := tenancyLeafUnder(pilotDistrict()); only != "" {
			schools = []string{only}
		} else {
			return
		}
	}
	titles := []struct{ book, title string }{
		{"BK-TAM-001", "Ponniyin Selvan"}, {"BK-SCI-002", "NCERT Science 8"},
		{"BK-MAT-003", "NCERT Mathematics 8"}, {"BK-ENG-004", "Wings of Fire"},
	}
	// six loans; the first two were issued back in May → overdue against any mid-June+ date.
	loans := []struct {
		id, book, copyID, member, issued string
	}{
		{"LOAN-001", "BK-TAM-001", "CP-TAM-001-1", "SYN-S-001", "2026-05-01"},
		{"LOAN-002", "BK-SCI-002", "CP-SCI-002-1", "SYN-S-002", "2026-05-10"},
		{"LOAN-003", "BK-MAT-003", "CP-MAT-003-1", "SYN-S-003", "2026-06-15"},
		{"LOAN-004", "BK-ENG-004", "CP-ENG-004-1", "SYN-S-004", "2026-06-16"},
		{"LOAN-005", "BK-TAM-001", "CP-TAM-001-2", "SYN-S-005", "2026-06-17"},
		{"LOAN-006", "BK-SCI-002", "CP-SCI-002-2", "SYN-T-001", "2026-06-18"},
	}
	titleOf := map[string]string{}
	for _, t := range titles {
		titleOf[t.book] = t.title
	}
	for si, school := range schools {
		sfx := ""
		if si > 0 {
			sfx = "-" + schoolTag(si)
		}
		for _, ln := range loans {
			l, err := library.NewLoan(ln.id+sfx, school, ln.book, titleOf[ln.book], ln.copyID+sfx, ln.member+sfx, ln.issued)
			if err != nil {
				continue
			}
			s.Issue(l)
		}
	}
}

// IssueBook issues a physical copy to a member (rejecting a copy already on loan). Audited.
func (p *Platform) IssueBook(l library.Loan) (library.Loan, error) {
	out, err := libState().Issue(l)
	if err != nil {
		p.appendAudit("librarian", "library.issue.denied", l.CopyID, "deny", err.Error())
		return library.Loan{}, err
	}
	p.appendAudit("librarian", "library.issue", l.ID, "executed", fmt.Sprintf("%s → %s due %s", l.CopyID, l.MemberID, l.DueOn))
	return out, nil
}

// ReturnBook returns an on-loan copy. Audited.
func (p *Platform) ReturnBook(id, on string) (library.Loan, error) {
	out, err := libState().Return(id, on)
	if err != nil {
		p.appendAudit("librarian", "library.return.denied", id, "deny", err.Error())
		return library.Loan{}, err
	}
	p.appendAudit("librarian", "library.return", id, "executed", "returned "+on)
	return out, nil
}

// RenewBook extends an on-loan copy's due date. Audited.
func (p *Platform) RenewBook(id string) (library.Loan, error) {
	out, err := libState().Renew(id)
	if err != nil {
		p.appendAudit("librarian", "library.renew.denied", id, "deny", err.Error())
		return library.Loan{}, err
	}
	p.appendAudit("librarian", "library.renew", id, "executed", "renewed to "+out.DueOn)
	return out, nil
}

// ReportBookLost marks an on-loan copy lost. Audited.
func (p *Platform) ReportBookLost(id string) (library.Loan, error) {
	out, err := libState().MarkLost(id)
	if err != nil {
		p.appendAudit("librarian", "library.lost.denied", id, "deny", err.Error())
		return library.Loan{}, err
	}
	p.appendAudit("librarian", "library.lost", id, "executed", "marked lost")
	return out, nil
}

// MemberLoans returns a member's circulation history (most recent first).
func (p *Platform) MemberLoans(member string) []library.Loan {
	return libState().List(library.Filter{Member: member})
}

// LibraryDashboard is the jurisdiction-scoped circulation picture: active loans, the overdue roster (as of
// today), copies lost, distinct members and titles in circulation. Downward-governance scoped.
type LibraryDashboard struct {
	Scope        string         `json:"scope"`
	AsOf         string         `json:"as_of"`
	ActiveLoans  int            `json:"active_loans"`
	Overdue      int            `json:"overdue"`
	OverdueLoans []library.Loan `json:"overdue_loans,omitempty"`
	Lost         int            `json:"lost"`
	Members      int            `json:"members"`
	Titles       int            `json:"titles"`
	Synthetic    bool           `json:"synthetic"`
}

// LibraryDashboard rolls up circulation for the school libraries a tenant node governs, as of today.
func (p *Platform) LibraryDashboard(scopeOrg string) LibraryDashboard {
	asOf := time.Now().UTC().Format("2006-01-02")
	d := LibraryDashboard{Scope: scopeOrg, AsOf: asOf, Synthetic: true}
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return d
	}
	members := map[string]bool{}
	titles := map[string]bool{}
	for _, l := range libState().List(library.Filter{}) {
		if !h.Governs(scopeOrg, l.OrgUnit) {
			continue
		}
		switch l.Status {
		case library.OnLoan:
			d.ActiveLoans++
			members[l.MemberID] = true
			titles[l.BookID] = true
			if library.IsOverdue(l, asOf) {
				d.Overdue++
				d.OverdueLoans = append(d.OverdueLoans, l)
			}
		case library.Lost:
			d.Lost++
		}
	}
	d.Members = len(members)
	d.Titles = len(titles)
	return d
}
