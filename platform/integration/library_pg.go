package integration

import (
	"database/sql"
	"errors"

	"github.com/vasa-eos-se-tn/platform/library"
)

// pgLibStore is the durable PostgreSQL adapter for library circulation. The one-copy-one-borrower invariant is
// enforced with a targeted SQL existence check before the insert; transitions reuse the pure Apply* functions.
type pgLibStore struct{ db *sql.DB }

func newPgLibStore(dsn string) (*pgLibStore, error) {
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, err
	}
	if err := db.Ping(); err != nil {
		return nil, err
	}
	s := &pgLibStore{db: db}
	if err := s.ensureSchema(); err != nil {
		return nil, err
	}
	return s, nil
}

func (s *pgLibStore) ensureSchema() error {
	_, err := s.db.Exec(`
CREATE TABLE IF NOT EXISTS library_loans (
    id          TEXT PRIMARY KEY,
    org_unit    TEXT NOT NULL,
    book_id     TEXT NOT NULL,
    title       TEXT NOT NULL DEFAULT '',
    copy_id     TEXT NOT NULL,
    member_id   TEXT NOT NULL,
    issued_on   TEXT NOT NULL,
    due_on      TEXT NOT NULL,
    returned_on TEXT NOT NULL DEFAULT '',
    status      TEXT NOT NULL,
    renewals    INT  NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS library_member_idx ON library_loans (member_id);
-- at most one active loan per physical copy (the one-copy-one-borrower invariant, enforced in the schema).
CREATE UNIQUE INDEX IF NOT EXISTS library_copy_active_idx ON library_loans (org_unit, copy_id) WHERE status='on_loan';`)
	return err
}

const libCols = "id,org_unit,book_id,title,copy_id,member_id,issued_on,due_on,returned_on,status,renewals"

func scanLoan(row interface{ Scan(...any) error }) (library.Loan, error) {
	var l library.Loan
	err := row.Scan(&l.ID, &l.OrgUnit, &l.BookID, &l.Title, &l.CopyID, &l.MemberID, &l.IssuedOn, &l.DueOn, &l.ReturnedOn, &l.Status, &l.Renewals)
	return l, err
}

// Issue inserts a new loan, checking the one-copy-one-borrower invariant in SQL first (and backstopped by the
// partial unique index) before the insert.
func (s *pgLibStore) Issue(l library.Loan) (library.Loan, error) {
	if err := l.Validate(); err != nil {
		return library.Loan{}, err
	}
	var holder string
	err := s.db.QueryRow(`SELECT id FROM library_loans
        WHERE org_unit=$1 AND copy_id=$2 AND status='on_loan' AND id<>$3 LIMIT 1`,
		l.OrgUnit, l.CopyID, l.ID).Scan(&holder)
	if err == nil {
		return library.Loan{}, errors.New("library: copy " + l.CopyID + " is already on loan (" + holder + ")")
	} else if err != sql.ErrNoRows {
		return library.Loan{}, err
	}
	if _, err := s.db.Exec(`INSERT INTO library_loans (`+libCols+`)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        ON CONFLICT (id) DO UPDATE SET org_unit=$2,book_id=$3,title=$4,copy_id=$5,member_id=$6,issued_on=$7,due_on=$8,returned_on=$9,status=$10,renewals=$11`,
		l.ID, l.OrgUnit, l.BookID, l.Title, l.CopyID, l.MemberID, l.IssuedOn, l.DueOn, l.ReturnedOn, l.Status, l.Renewals); err != nil {
		return library.Loan{}, err
	}
	return l, nil
}

func (s *pgLibStore) Get(id string) (library.Loan, bool) {
	l, err := scanLoan(s.db.QueryRow(`SELECT `+libCols+` FROM library_loans WHERE id=$1`, id))
	if err != nil {
		return library.Loan{}, false
	}
	return l, true
}

// update persists the post-transition state of a loan.
func (s *pgLibStore) update(l library.Loan) error {
	_, err := s.db.Exec(`UPDATE library_loans SET due_on=$2,returned_on=$3,status=$4,renewals=$5 WHERE id=$1`,
		l.ID, l.DueOn, l.ReturnedOn, l.Status, l.Renewals)
	return err
}

// Return reads the loan, applies the pure return transition, then persists it.
func (s *pgLibStore) Return(id, on string) (library.Loan, error) {
	l, ok := s.Get(id)
	if !ok {
		return library.Loan{}, errors.New("library: no such loan " + id)
	}
	out, err := library.ApplyReturn(l, on)
	if err != nil {
		return library.Loan{}, err
	}
	return out, s.update(out)
}

// Renew reads the loan, applies the pure renew transition, then persists it.
func (s *pgLibStore) Renew(id string) (library.Loan, error) {
	l, ok := s.Get(id)
	if !ok {
		return library.Loan{}, errors.New("library: no such loan " + id)
	}
	out, err := library.ApplyRenew(l)
	if err != nil {
		return library.Loan{}, err
	}
	return out, s.update(out)
}

// MarkLost reads the loan, applies the pure lost transition, then persists it.
func (s *pgLibStore) MarkLost(id string) (library.Loan, error) {
	l, ok := s.Get(id)
	if !ok {
		return library.Loan{}, errors.New("library: no such loan " + id)
	}
	out, err := library.ApplyLost(l)
	if err != nil {
		return library.Loan{}, err
	}
	return out, s.update(out)
}

func (s *pgLibStore) List(f library.Filter) []library.Loan {
	rows, err := s.db.Query(`SELECT ` + libCols + ` FROM library_loans ORDER BY issued_on DESC, id`)
	if err != nil {
		return nil
	}
	defer rows.Close()
	var out []library.Loan
	for rows.Next() {
		l, err := scanLoan(rows)
		if err != nil {
			continue
		}
		if library.Match(f, l) {
			out = append(out, l)
		}
	}
	return out
}
