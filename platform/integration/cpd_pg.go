package integration

import (
	"database/sql"

	"github.com/vasa-eos-se-tn/platform/cpd"
)

// pgCpdStore is the durable PostgreSQL adapter for teacher CPD records (upserted by id).
type pgCpdStore struct{ db *sql.DB }

func newPgCpdStore(dsn string) (*pgCpdStore, error) {
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, err
	}
	if err := db.Ping(); err != nil {
		return nil, err
	}
	s := &pgCpdStore{db: db}
	if err := s.ensureSchema(); err != nil {
		return nil, err
	}
	return s, nil
}

func (s *pgCpdStore) ensureSchema() error {
	_, err := s.db.Exec(`
CREATE TABLE IF NOT EXISTS cpd_records (
    id           TEXT PRIMARY KEY,
    teacher_id   TEXT NOT NULL,
    org_unit     TEXT NOT NULL,
    course       TEXT NOT NULL DEFAULT '',
    provider     TEXT NOT NULL,
    hours        INT  NOT NULL DEFAULT 0,
    year         INT  NOT NULL,
    status       TEXT NOT NULL,
    completed_on TEXT NOT NULL DEFAULT '',
    recorded_at  TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS cpd_teacher_year_idx ON cpd_records (teacher_id, year);
CREATE INDEX IF NOT EXISTS cpd_org_year_idx     ON cpd_records (org_unit, year);`)
	return err
}

const cpdCols = "id,teacher_id,org_unit,course,provider,hours,year,status,completed_on,recorded_at"

func scanCpd(row interface{ Scan(...any) error }) (cpd.Record, error) {
	var r cpd.Record
	err := row.Scan(&r.ID, &r.TeacherID, &r.OrgUnit, &r.Course, &r.Provider, &r.Hours, &r.Year, &r.Status, &r.CompletedOn, &r.RecordedAt)
	return r, err
}

// Record upserts a CPD record by id.
func (s *pgCpdStore) Record(r cpd.Record) (cpd.Record, error) {
	if err := r.Validate(); err != nil {
		return cpd.Record{}, err
	}
	if _, err := s.db.Exec(`INSERT INTO cpd_records (`+cpdCols+`)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        ON CONFLICT (id) DO UPDATE SET teacher_id=$2,org_unit=$3,course=$4,provider=$5,hours=$6,year=$7,status=$8,completed_on=$9,recorded_at=$10`,
		r.ID, r.TeacherID, r.OrgUnit, r.Course, r.Provider, r.Hours, r.Year, r.Status, r.CompletedOn, r.RecordedAt); err != nil {
		return cpd.Record{}, err
	}
	return r, nil
}

func (s *pgCpdStore) Get(id string) (cpd.Record, bool) {
	r, err := scanCpd(s.db.QueryRow(`SELECT `+cpdCols+` FROM cpd_records WHERE id=$1`, id))
	if err != nil {
		return cpd.Record{}, false
	}
	return r, true
}

func (s *pgCpdStore) List(f cpd.Filter) []cpd.Record {
	rows, err := s.db.Query(`SELECT ` + cpdCols + ` FROM cpd_records ORDER BY completed_on DESC, id`)
	if err != nil {
		return nil
	}
	defer rows.Close()
	var out []cpd.Record
	for rows.Next() {
		r, err := scanCpd(rows)
		if err != nil {
			continue
		}
		if cpd.Match(f, r) {
			out = append(out, r)
		}
	}
	return out
}
