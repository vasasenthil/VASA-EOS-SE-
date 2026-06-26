package integration

import (
	"database/sql"

	"github.com/vasa-eos-se-tn/platform/attendance"
)

// pgAttStore is the durable PostgreSQL adapter for student attendance (one row per student per day, upserted).
type pgAttStore struct{ db *sql.DB }

func newPgAttStore(dsn string) (*pgAttStore, error) {
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, err
	}
	if err := db.Ping(); err != nil {
		return nil, err
	}
	s := &pgAttStore{db: db}
	if err := s.ensureSchema(); err != nil {
		return nil, err
	}
	return s, nil
}

func (s *pgAttStore) ensureSchema() error {
	_, err := s.db.Exec(`
CREATE TABLE IF NOT EXISTS attendance_records (
    student_id TEXT NOT NULL,
    org_unit   TEXT NOT NULL,
    date       TEXT NOT NULL,
    status     TEXT NOT NULL,
    source     TEXT NOT NULL DEFAULT '',
    marked_by  TEXT NOT NULL DEFAULT '',
    marked_at  TEXT NOT NULL DEFAULT '',
    PRIMARY KEY (student_id, date)
);
CREATE INDEX IF NOT EXISTS attendance_org_date_idx ON attendance_records (org_unit, date);
CREATE INDEX IF NOT EXISTS attendance_student_idx  ON attendance_records (student_id);`)
	return err
}

const attCols = "student_id,org_unit,date,status,source,marked_by,marked_at"

func scanAtt(row interface{ Scan(...any) error }) (attendance.Record, error) {
	var r attendance.Record
	err := row.Scan(&r.StudentID, &r.OrgUnit, &r.Date, &r.Status, &r.Source, &r.MarkedBy, &r.MarkedAt)
	return r, err
}

// Mark upserts a student's attendance for a day (re-marking corrects the record).
func (s *pgAttStore) Mark(r attendance.Record) (attendance.Record, error) {
	if err := r.Validate(); err != nil {
		return attendance.Record{}, err
	}
	if _, err := s.db.Exec(`INSERT INTO attendance_records (`+attCols+`)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        ON CONFLICT (student_id, date) DO UPDATE SET org_unit=$2,status=$4,source=$5,marked_by=$6,marked_at=$7`,
		r.StudentID, r.OrgUnit, r.Date, r.Status, r.Source, r.MarkedBy, r.MarkedAt); err != nil {
		return attendance.Record{}, err
	}
	return r, nil
}

func (s *pgAttStore) Get(student, date string) (attendance.Record, bool) {
	r, err := scanAtt(s.db.QueryRow(`SELECT `+attCols+` FROM attendance_records WHERE student_id=$1 AND date=$2`, student, date))
	if err != nil {
		return attendance.Record{}, false
	}
	return r, true
}

func (s *pgAttStore) List(f attendance.Filter) []attendance.Record {
	rows, err := s.db.Query(`SELECT ` + attCols + ` FROM attendance_records ORDER BY date, student_id`)
	if err != nil {
		return nil
	}
	defer rows.Close()
	var out []attendance.Record
	for rows.Next() {
		r, err := scanAtt(rows)
		if err != nil {
			continue
		}
		if attendance.Match(f, r) {
			out = append(out, r)
		}
	}
	return out
}
