package integration

import (
	"database/sql"
	"encoding/json"
)

// pgWashStore is the durable PostgreSQL adapter for the school sanitation / WASH register.
type pgWashStore struct{ db *sql.DB }

func newPgWashStore(dsn string) (*pgWashStore, error) {
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, err
	}
	if err := db.Ping(); err != nil {
		return nil, err
	}
	s := &pgWashStore{db: db}
	if err := s.ensureSchema(); err != nil {
		return nil, err
	}
	return s, nil
}

func (s *pgWashStore) ensureSchema() error {
	_, err := s.db.Exec(`
CREATE TABLE IF NOT EXISTS wash_registers (
    id           TEXT PRIMARY KEY,
    org_unit     TEXT NOT NULL,
    school_name  TEXT NOT NULL,
    facilities   TEXT NOT NULL DEFAULT '[]',
    certified    BOOLEAN NOT NULL DEFAULT FALSE,
    certified_on TEXT NOT NULL DEFAULT '',
    status       TEXT NOT NULL,
    created_on   TEXT NOT NULL DEFAULT '',
    updated_at   TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS wash_org_idx    ON wash_registers (org_unit);
CREATE INDEX IF NOT EXISTS wash_status_idx ON wash_registers (status);`)
	return err
}

const washCols = "id,org_unit,school_name,facilities,certified,certified_on,status,created_on,updated_at"

func scanWash(row interface{ Scan(...any) error }) (WashRegister, error) {
	var w WashRegister
	var facilities string
	err := row.Scan(&w.ID, &w.OrgUnit, &w.SchoolName, &facilities, &w.Certified, &w.CertifiedOn, &w.Status, &w.CreatedOn, &w.UpdatedAt)
	if err != nil {
		return WashRegister{}, err
	}
	if facilities != "" && facilities != "[]" {
		_ = json.Unmarshal([]byte(facilities), &w.Facilities)
	}
	return w, nil
}

func (s *pgWashStore) Upsert(w WashRegister) (WashRegister, error) {
	facilities, err := json.Marshal(w.Facilities)
	if err != nil {
		return WashRegister{}, err
	}
	if len(w.Facilities) == 0 {
		facilities = []byte("[]")
	}
	if _, err := s.db.Exec(`INSERT INTO wash_registers (`+washCols+`)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        ON CONFLICT (id) DO UPDATE SET org_unit=$2,school_name=$3,facilities=$4,certified=$5,certified_on=$6,status=$7,created_on=$8,updated_at=$9`,
		w.ID, w.OrgUnit, w.SchoolName, string(facilities), w.Certified, w.CertifiedOn, w.Status, w.CreatedOn, w.UpdatedAt); err != nil {
		return WashRegister{}, err
	}
	return w, nil
}

func (s *pgWashStore) Get(id string) (WashRegister, bool) {
	w, err := scanWash(s.db.QueryRow(`SELECT `+washCols+` FROM wash_registers WHERE id=$1`, id))
	if err != nil {
		return WashRegister{}, false
	}
	return w, true
}

func (s *pgWashStore) List(f washFilter) []WashRegister {
	rows, err := s.db.Query(`SELECT ` + washCols + ` FROM wash_registers`)
	if err != nil {
		return nil
	}
	defer rows.Close()
	var out []WashRegister
	for rows.Next() {
		w, err := scanWash(rows)
		if err != nil {
			continue
		}
		if matchWash(f, w) {
			out = append(out, w)
		}
	}
	return out
}
