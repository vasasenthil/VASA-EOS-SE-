package integration

import (
	"database/sql"
	"errors"

	"github.com/vasa-eos-se-tn/platform/exams"
)

// examStore is the persistence port for examination marks sheets. Two adapters satisfy it: the in-memory
// *exams.Register (demo) and *pgExamStore (durable PostgreSQL, selected when DATABASE_URL is set).
type examStore interface {
	Add(*exams.Sheet) error
	Get(string) (*exams.Sheet, bool)
	Enter(examID, studentID string, marks int) error
	Submit(examID string) error
	Moderate(examID string, approve bool) error
	Sheets() []*exams.Sheet
}

// pgExamStore persists marks sheets (and their per-student results) to PostgreSQL. Every operation rehydrates
// the sheet via exams.LoadSheet, applies the SAME domain method as the in-memory store, and saves it back in a
// transaction — so behaviour is identical and durable.
type pgExamStore struct{ db *sql.DB }

func newPgExamStore(dsn string) (*pgExamStore, error) {
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, err
	}
	if err := db.Ping(); err != nil {
		return nil, err
	}
	s := &pgExamStore{db: db}
	if err := s.ensureSchema(); err != nil {
		return nil, err
	}
	return s, nil
}

func (s *pgExamStore) ensureSchema() error {
	_, err := s.db.Exec(`
CREATE TABLE IF NOT EXISTS exam_sheets (
    exam_id   TEXT PRIMARY KEY,
    org_unit  TEXT NOT NULL,
    subject   TEXT NOT NULL,
    class     TEXT NOT NULL,
    max_marks INT  NOT NULL,
    status    TEXT NOT NULL DEFAULT 'open'
);
CREATE TABLE IF NOT EXISTS exam_results (
    exam_id    TEXT NOT NULL REFERENCES exam_sheets(exam_id) ON DELETE CASCADE,
    student_id TEXT NOT NULL,
    marks      INT  NOT NULL,
    grade      TEXT NOT NULL DEFAULT '',
    pass       BOOLEAN NOT NULL DEFAULT false,
    seq        BIGSERIAL,
    PRIMARY KEY (exam_id, student_id)
);
CREATE INDEX IF NOT EXISTS exam_sheets_org_idx ON exam_sheets (org_unit);`)
	return err
}

// loadSheet rehydrates a full sheet (metadata + results in entry order) from the database.
func (s *pgExamStore) loadSheet(examID string) (*exams.Sheet, bool) {
	var org, subject, class, status string
	var max int
	err := s.db.QueryRow(`SELECT org_unit,subject,class,max_marks,status FROM exam_sheets WHERE exam_id=$1`, examID).
		Scan(&org, &subject, &class, &max, &status)
	if err != nil {
		return nil, false
	}
	rows, err := s.db.Query(`SELECT student_id,marks,grade,pass FROM exam_results WHERE exam_id=$1 ORDER BY seq`, examID)
	if err != nil {
		return nil, false
	}
	defer rows.Close()
	var results []exams.Result
	for rows.Next() {
		var r exams.Result
		if err := rows.Scan(&r.StudentID, &r.Marks, &r.Grade, &r.Pass); err == nil {
			results = append(results, r)
		}
	}
	return exams.LoadSheet(examID, org, subject, class, max, status, results), true
}

func (s *pgExamStore) Get(examID string) (*exams.Sheet, bool) { return s.loadSheet(examID) }

// Add inserts a new sheet and its results. A duplicate exam id is rejected by the primary key (so idempotent
// seeding on restart leaves existing data untouched).
func (s *pgExamStore) Add(sh *exams.Sheet) error {
	tx, err := s.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()
	if _, err := tx.Exec(`INSERT INTO exam_sheets (exam_id,org_unit,subject,class,max_marks,status) VALUES ($1,$2,$3,$4,$5,$6)`,
		sh.ExamID, sh.OrgUnit, sh.Subject, sh.Class, sh.MaxMarks, sh.Status); err != nil {
		return err // duplicate exam id → caller (seed) ignores
	}
	for _, r := range sh.Results() {
		if _, err := tx.Exec(`INSERT INTO exam_results (exam_id,student_id,marks,grade,pass) VALUES ($1,$2,$3,$4,$5)`,
			sh.ExamID, r.StudentID, r.Marks, r.Grade, r.Pass); err != nil {
			return err
		}
	}
	return tx.Commit()
}

// save writes a sheet's status and replaces its result rows (after a domain operation), atomically.
func (s *pgExamStore) save(sh *exams.Sheet) error {
	tx, err := s.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()
	if _, err := tx.Exec(`UPDATE exam_sheets SET status=$2 WHERE exam_id=$1`, sh.ExamID, sh.Status); err != nil {
		return err
	}
	if _, err := tx.Exec(`DELETE FROM exam_results WHERE exam_id=$1`, sh.ExamID); err != nil {
		return err
	}
	for _, r := range sh.Results() {
		if _, err := tx.Exec(`INSERT INTO exam_results (exam_id,student_id,marks,grade,pass) VALUES ($1,$2,$3,$4,$5)`,
			sh.ExamID, r.StudentID, r.Marks, r.Grade, r.Pass); err != nil {
			return err
		}
	}
	return tx.Commit()
}

// applyAndSave loads the sheet, runs op (an in-memory domain method), and persists the result.
func (s *pgExamStore) applyAndSave(examID string, op func(*exams.Sheet) error) error {
	sh, ok := s.loadSheet(examID)
	if !ok {
		return errors.New("exams: sheet not found")
	}
	if err := op(sh); err != nil {
		return err
	}
	return s.save(sh)
}

func (s *pgExamStore) Enter(examID, studentID string, marks int) error {
	return s.applyAndSave(examID, func(sh *exams.Sheet) error { return sh.Enter(studentID, marks) })
}

func (s *pgExamStore) Submit(examID string) error {
	return s.applyAndSave(examID, func(sh *exams.Sheet) error { return sh.Submit() })
}

func (s *pgExamStore) Moderate(examID string, approve bool) error {
	return s.applyAndSave(examID, func(sh *exams.Sheet) error { return sh.Moderate(approve) })
}

// Sheets returns every sheet (rehydrated) in insertion order by exam id.
func (s *pgExamStore) Sheets() []*exams.Sheet {
	rows, err := s.db.Query(`SELECT exam_id FROM exam_sheets ORDER BY exam_id`)
	if err != nil {
		return nil
	}
	defer rows.Close()
	var ids []string
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err == nil {
			ids = append(ids, id)
		}
	}
	var out []*exams.Sheet
	for _, id := range ids {
		if sh, ok := s.loadSheet(id); ok {
			out = append(out, sh)
		}
	}
	return out
}
