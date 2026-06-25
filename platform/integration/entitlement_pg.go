package integration

import (
	"database/sql"
	"errors"
	"strconv"

	"github.com/vasa-eos-se-tn/platform/entitlement"
)

// pgEntStore is the durable PostgreSQL adapter for the entitlement register (entitlements + issues). The
// over-issue invariant is enforced against the durable issued total inside the same transaction that writes the
// issue and recomputes the entitlement status, so the distribution and status are atomic.
type pgEntStore struct{ db *sql.DB }

func newPgEntStore(dsn string) (*pgEntStore, error) {
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, err
	}
	if err := db.Ping(); err != nil {
		return nil, err
	}
	s := &pgEntStore{db: db}
	if err := s.ensureSchema(); err != nil {
		return nil, err
	}
	return s, nil
}

func (s *pgEntStore) ensureSchema() error {
	_, err := s.db.Exec(`
CREATE TABLE IF NOT EXISTS entitlements (
    id           TEXT PRIMARY KEY,
    org_unit     TEXT NOT NULL,
    student_id   TEXT NOT NULL,
    item         TEXT NOT NULL,
    entitled_qty INT  NOT NULL,
    term         TEXT NOT NULL DEFAULT '',
    status       TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS entitlement_issues (
    id             TEXT PRIMARY KEY,
    entitlement_id TEXT NOT NULL,
    org_unit       TEXT NOT NULL,
    student_id     TEXT NOT NULL,
    qty            INT  NOT NULL,
    issued_on      TEXT NOT NULL,
    reference      TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS entitlements_org_idx       ON entitlements (org_unit, status);
CREATE INDEX IF NOT EXISTS entitlement_issues_ent_idx ON entitlement_issues (entitlement_id);`)
	return err
}

const entCols = "id,org_unit,student_id,item,entitled_qty,term,status"
const entIssueCols = "id,entitlement_id,org_unit,student_id,qty,issued_on,reference"

func scanEntitlement(row interface{ Scan(...any) error }) (entitlement.Entitlement, error) {
	var e entitlement.Entitlement
	err := row.Scan(&e.ID, &e.OrgUnit, &e.StudentID, &e.Item, &e.EntitledQty, &e.Term, &e.Status)
	return e, err
}

func scanIssue(row interface{ Scan(...any) error }) (entitlement.Issue, error) {
	var i entitlement.Issue
	err := row.Scan(&i.ID, &i.EntitlementID, &i.OrgUnit, &i.StudentID, &i.Qty, &i.IssuedOn, &i.Reference)
	return i, err
}

// GrantEntitlement validates then upserts an entitlement by id.
func (s *pgEntStore) GrantEntitlement(e entitlement.Entitlement) (entitlement.Entitlement, error) {
	if e.Status == "" {
		e.Status = entitlement.Pending
	}
	if err := e.Validate(); err != nil {
		return entitlement.Entitlement{}, err
	}
	if _, err := s.db.Exec(`INSERT INTO entitlements (`+entCols+`)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        ON CONFLICT (id) DO UPDATE SET org_unit=$2,student_id=$3,item=$4,entitled_qty=$5,term=$6,status=$7`,
		e.ID, e.OrgUnit, e.StudentID, e.Item, e.EntitledQty, e.Term, e.Status); err != nil {
		return entitlement.Entitlement{}, err
	}
	return e, nil
}

func (s *pgEntStore) GetEntitlement(id string) (entitlement.Entitlement, bool) {
	e, err := scanEntitlement(s.db.QueryRow(`SELECT `+entCols+` FROM entitlements WHERE id=$1`, id))
	if err != nil {
		return entitlement.Entitlement{}, false
	}
	return e, true
}

// issuedExcluding returns the issued total for an entitlement from a queryer, excluding one issue id.
func issuedExcluding(q interface {
	QueryRow(string, ...any) *sql.Row
}, entitlementID, excludeID string) (int, error) {
	var n sql.NullInt64
	err := q.QueryRow(`SELECT COALESCE(SUM(qty),0) FROM entitlement_issues WHERE entitlement_id=$1 AND id<>$2`, entitlementID, excludeID).Scan(&n)
	if err != nil {
		return 0, err
	}
	return int(n.Int64), nil
}

// IssueSupply enforces the over-issue gate against the durable issued total and, in one transaction, writes the
// issue and recomputes the entitlement status.
func (s *pgEntStore) IssueSupply(i entitlement.Issue) (entitlement.Issue, error) {
	if err := i.Validate(); err != nil {
		return entitlement.Issue{}, err
	}
	e, ok := s.GetEntitlement(i.EntitlementID)
	if !ok {
		return entitlement.Issue{}, errors.New("entitlement: unknown entitlement " + i.EntitlementID)
	}
	if !e.Open() {
		return entitlement.Issue{}, errors.New("entitlement: " + e.ID + " is " + e.Status + " and takes no more issues")
	}
	if i.OrgUnit == "" {
		i.OrgUnit = e.OrgUnit
	}
	if i.StudentID == "" {
		i.StudentID = e.StudentID
	}
	tx, err := s.db.Begin()
	if err != nil {
		return entitlement.Issue{}, err
	}
	defer tx.Rollback()
	priorOthers, err := issuedExcluding(tx, i.EntitlementID, i.ID)
	if err != nil {
		return entitlement.Issue{}, err
	}
	if priorOthers+i.Qty > e.EntitledQty {
		return entitlement.Issue{}, errors.New("entitlement: issue would over-issue " + e.ID +
			" — remaining " + strconv.Itoa(e.EntitledQty-priorOthers) + ", tendered " + strconv.Itoa(i.Qty))
	}
	if _, err := tx.Exec(`INSERT INTO entitlement_issues (`+entIssueCols+`)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        ON CONFLICT (id) DO UPDATE SET entitlement_id=$2,org_unit=$3,student_id=$4,qty=$5,issued_on=$6,reference=$7`,
		i.ID, i.EntitlementID, i.OrgUnit, i.StudentID, i.Qty, i.IssuedOn, i.Reference); err != nil {
		return entitlement.Issue{}, err
	}
	newStatus := entitlement.Pending
	if total := priorOthers + i.Qty; total >= e.EntitledQty {
		newStatus = entitlement.Fulfilled
	} else if total > 0 {
		newStatus = entitlement.Partial
	}
	if _, err := tx.Exec(`UPDATE entitlements SET status=$2 WHERE id=$1`, e.ID, newStatus); err != nil {
		return entitlement.Issue{}, err
	}
	if err := tx.Commit(); err != nil {
		return entitlement.Issue{}, err
	}
	return i, nil
}

func (s *pgEntStore) Remaining(id string) int {
	e, ok := s.GetEntitlement(id)
	if !ok || !e.Open() {
		return 0
	}
	issued, err := issuedExcluding(s.db, id, "")
	if err != nil {
		return 0
	}
	return e.EntitledQty - issued
}

func (s *pgEntStore) ListEntitlements(f entitlement.EntitlementFilter) []entitlement.Entitlement {
	rows, err := s.db.Query(`SELECT ` + entCols + ` FROM entitlements ORDER BY student_id, id`)
	if err != nil {
		return nil
	}
	defer rows.Close()
	var out []entitlement.Entitlement
	for rows.Next() {
		e, err := scanEntitlement(rows)
		if err != nil {
			continue
		}
		if entitlement.MatchEntitlement(f, e) {
			out = append(out, e)
		}
	}
	return out
}

func (s *pgEntStore) ListIssues(f entitlement.IssueFilter) []entitlement.Issue {
	rows, err := s.db.Query(`SELECT ` + entIssueCols + ` FROM entitlement_issues ORDER BY issued_on DESC, id`)
	if err != nil {
		return nil
	}
	defer rows.Close()
	var out []entitlement.Issue
	for rows.Next() {
		i, err := scanIssue(rows)
		if err != nil {
			continue
		}
		if entitlement.MatchIssue(f, i) {
			out = append(out, i)
		}
	}
	return out
}
