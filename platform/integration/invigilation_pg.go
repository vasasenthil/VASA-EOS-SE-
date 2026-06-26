package integration

import (
	"database/sql"
	"encoding/json"
)

// pgDutyStore is the durable PostgreSQL adapter for the exam invigilation duty roster.
type pgDutyStore struct{ db *sql.DB }

func newPgDutyStore(dsn string) (*pgDutyStore, error) {
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, err
	}
	if err := db.Ping(); err != nil {
		return nil, err
	}
	s := &pgDutyStore{db: db}
	if err := s.ensureSchema(); err != nil {
		return nil, err
	}
	return s, nil
}

func (s *pgDutyStore) ensureSchema() error {
	_, err := s.db.Exec(`
CREATE TABLE IF NOT EXISTS duty_sessions (
    id                   TEXT PRIMARY KEY,
    org_unit             TEXT NOT NULL,
    exam                 TEXT NOT NULL,
    date                 TEXT NOT NULL,
    slot                 TEXT NOT NULL,
    hall                 TEXT NOT NULL,
    required_invigilators INTEGER NOT NULL,
    invigilators         TEXT NOT NULL DEFAULT '[]',
    status               TEXT NOT NULL,
    created_on           TEXT NOT NULL DEFAULT '',
    updated_at           TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS duty_org_idx    ON duty_sessions (org_unit);
CREATE INDEX IF NOT EXISTS duty_date_idx   ON duty_sessions (date);
CREATE INDEX IF NOT EXISTS duty_status_idx ON duty_sessions (status);`)
	return err
}

const dutyCols = "id,org_unit,exam,date,slot,hall,required_invigilators,invigilators,status,created_on,updated_at"

func scanDuty(row interface{ Scan(...any) error }) (DutySession, error) {
	var d DutySession
	var inv string
	err := row.Scan(&d.ID, &d.OrgUnit, &d.Exam, &d.Date, &d.Slot, &d.Hall, &d.RequiredInvigilators, &inv, &d.Status, &d.CreatedOn, &d.UpdatedAt)
	if err != nil {
		return DutySession{}, err
	}
	if inv != "" && inv != "[]" {
		_ = json.Unmarshal([]byte(inv), &d.Invigilators)
	}
	return d, nil
}

func (s *pgDutyStore) Upsert(d DutySession) (DutySession, error) {
	inv, err := json.Marshal(d.Invigilators)
	if err != nil {
		return DutySession{}, err
	}
	if len(d.Invigilators) == 0 {
		inv = []byte("[]")
	}
	if _, err := s.db.Exec(`INSERT INTO duty_sessions (`+dutyCols+`)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        ON CONFLICT (id) DO UPDATE SET org_unit=$2,exam=$3,date=$4,slot=$5,hall=$6,required_invigilators=$7,
            invigilators=$8,status=$9,created_on=$10,updated_at=$11`,
		d.ID, d.OrgUnit, d.Exam, d.Date, d.Slot, d.Hall, d.RequiredInvigilators, string(inv), d.Status, d.CreatedOn, d.UpdatedAt); err != nil {
		return DutySession{}, err
	}
	return d, nil
}

func (s *pgDutyStore) Get(id string) (DutySession, bool) {
	d, err := scanDuty(s.db.QueryRow(`SELECT `+dutyCols+` FROM duty_sessions WHERE id=$1`, id))
	if err != nil {
		return DutySession{}, false
	}
	return d, true
}

func (s *pgDutyStore) List(f dutyFilter) []DutySession {
	rows, err := s.db.Query(`SELECT ` + dutyCols + ` FROM duty_sessions`)
	if err != nil {
		return nil
	}
	defer rows.Close()
	var out []DutySession
	for rows.Next() {
		d, err := scanDuty(rows)
		if err != nil {
			continue
		}
		if matchDuty(f, d) {
			out = append(out, d)
		}
	}
	return out
}
