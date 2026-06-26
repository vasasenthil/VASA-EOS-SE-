package integration

import (
	"database/sql"
	"encoding/json"
)

// pgRemedialStore is the durable PostgreSQL adapter for diagnostic & remedial learning batches.
type pgRemedialStore struct{ db *sql.DB }

func newPgRemedialStore(dsn string) (*pgRemedialStore, error) {
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, err
	}
	if err := db.Ping(); err != nil {
		return nil, err
	}
	s := &pgRemedialStore{db: db}
	if err := s.ensureSchema(); err != nil {
		return nil, err
	}
	return s, nil
}

func (s *pgRemedialStore) ensureSchema() error {
	_, err := s.db.Exec(`
CREATE TABLE IF NOT EXISTS remedial_batches (
    id           TEXT PRIMARY KEY,
    org_unit     TEXT NOT NULL,
    subject      TEXT NOT NULL,
    target_level INTEGER NOT NULL,
    capacity     INTEGER NOT NULL,
    enrollments  TEXT NOT NULL DEFAULT '[]',
    status       TEXT NOT NULL,
    created_on   TEXT NOT NULL DEFAULT '',
    updated_at   TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS remedial_org_idx    ON remedial_batches (org_unit);
CREATE INDEX IF NOT EXISTS remedial_status_idx ON remedial_batches (status);`)
	return err
}

const remedialCols = "id,org_unit,subject,target_level,capacity,enrollments,status,created_on,updated_at"

func scanRemedial(row interface{ Scan(...any) error }) (RemedialBatch, error) {
	var b RemedialBatch
	var enr string
	err := row.Scan(&b.ID, &b.OrgUnit, &b.Subject, &b.TargetLevel, &b.Capacity, &enr, &b.Status, &b.CreatedOn, &b.UpdatedAt)
	if err != nil {
		return RemedialBatch{}, err
	}
	if enr != "" && enr != "[]" {
		_ = json.Unmarshal([]byte(enr), &b.Enrollments)
	}
	return b, nil
}

func (s *pgRemedialStore) Upsert(b RemedialBatch) (RemedialBatch, error) {
	enr, err := json.Marshal(b.Enrollments)
	if err != nil {
		return RemedialBatch{}, err
	}
	if len(b.Enrollments) == 0 {
		enr = []byte("[]")
	}
	if _, err := s.db.Exec(`INSERT INTO remedial_batches (`+remedialCols+`)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        ON CONFLICT (id) DO UPDATE SET org_unit=$2,subject=$3,target_level=$4,capacity=$5,enrollments=$6,
            status=$7,created_on=$8,updated_at=$9`,
		b.ID, b.OrgUnit, b.Subject, b.TargetLevel, b.Capacity, string(enr), b.Status, b.CreatedOn, b.UpdatedAt); err != nil {
		return RemedialBatch{}, err
	}
	return b, nil
}

func (s *pgRemedialStore) Get(id string) (RemedialBatch, bool) {
	b, err := scanRemedial(s.db.QueryRow(`SELECT `+remedialCols+` FROM remedial_batches WHERE id=$1`, id))
	if err != nil {
		return RemedialBatch{}, false
	}
	return b, true
}

func (s *pgRemedialStore) List(f remedialFilter) []RemedialBatch {
	rows, err := s.db.Query(`SELECT ` + remedialCols + ` FROM remedial_batches`)
	if err != nil {
		return nil
	}
	defer rows.Close()
	var out []RemedialBatch
	for rows.Next() {
		b, err := scanRemedial(rows)
		if err != nil {
			continue
		}
		if matchRemedial(f, b) {
			out = append(out, b)
		}
	}
	return out
}
