package integration

import (
	"database/sql"
	"encoding/json"
)

// pgClinicStore is the durable PostgreSQL adapter for the school health clinic / sick-room register.
type pgClinicStore struct{ db *sql.DB }

func newPgClinicStore(dsn string) (*pgClinicStore, error) {
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, err
	}
	if err := db.Ping(); err != nil {
		return nil, err
	}
	s := &pgClinicStore{db: db}
	if err := s.ensureSchema(); err != nil {
		return nil, err
	}
	return s, nil
}

func (s *pgClinicStore) ensureSchema() error {
	_, err := s.db.Exec(`
CREATE TABLE IF NOT EXISTS clinic_visits (
    id          TEXT PRIMARY KEY,
    org_unit    TEXT NOT NULL,
    student_id  TEXT NOT NULL,
    complaint   TEXT NOT NULL,
    treatments  TEXT NOT NULL DEFAULT '[]',
    outcome     TEXT NOT NULL DEFAULT '',
    destination TEXT NOT NULL DEFAULT '',
    reported_at TEXT NOT NULL DEFAULT '',
    closed_at   TEXT NOT NULL DEFAULT '',
    status      TEXT NOT NULL,
    created_on  TEXT NOT NULL DEFAULT '',
    updated_at  TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS clinic_org_idx     ON clinic_visits (org_unit);
CREATE INDEX IF NOT EXISTS clinic_status_idx  ON clinic_visits (status);
CREATE INDEX IF NOT EXISTS clinic_student_idx ON clinic_visits (student_id);`)
	return err
}

const clinicCols = "id,org_unit,student_id,complaint,treatments,outcome,destination,reported_at,closed_at,status,created_on,updated_at"

func scanClinic(row interface{ Scan(...any) error }) (ClinicVisit, error) {
	var v ClinicVisit
	var treatments string
	err := row.Scan(&v.ID, &v.OrgUnit, &v.StudentID, &v.Complaint, &treatments, &v.Outcome, &v.Destination, &v.ReportedAt, &v.ClosedAt, &v.Status, &v.CreatedOn, &v.UpdatedAt)
	if err != nil {
		return ClinicVisit{}, err
	}
	if treatments != "" && treatments != "[]" {
		_ = json.Unmarshal([]byte(treatments), &v.Treatments)
	}
	return v, nil
}

func (s *pgClinicStore) Upsert(v ClinicVisit) (ClinicVisit, error) {
	treatments, err := json.Marshal(v.Treatments)
	if err != nil {
		return ClinicVisit{}, err
	}
	if len(v.Treatments) == 0 {
		treatments = []byte("[]")
	}
	if _, err := s.db.Exec(`INSERT INTO clinic_visits (`+clinicCols+`)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
        ON CONFLICT (id) DO UPDATE SET org_unit=$2,student_id=$3,complaint=$4,treatments=$5,outcome=$6,
            destination=$7,reported_at=$8,closed_at=$9,status=$10,created_on=$11,updated_at=$12`,
		v.ID, v.OrgUnit, v.StudentID, v.Complaint, string(treatments), v.Outcome, v.Destination, v.ReportedAt, v.ClosedAt, v.Status, v.CreatedOn, v.UpdatedAt); err != nil {
		return ClinicVisit{}, err
	}
	return v, nil
}

func (s *pgClinicStore) Get(id string) (ClinicVisit, bool) {
	v, err := scanClinic(s.db.QueryRow(`SELECT `+clinicCols+` FROM clinic_visits WHERE id=$1`, id))
	if err != nil {
		return ClinicVisit{}, false
	}
	return v, true
}

func (s *pgClinicStore) List(f clinicFilter) []ClinicVisit {
	rows, err := s.db.Query(`SELECT ` + clinicCols + ` FROM clinic_visits`)
	if err != nil {
		return nil
	}
	defer rows.Close()
	var out []ClinicVisit
	for rows.Next() {
		v, err := scanClinic(rows)
		if err != nil {
			continue
		}
		if matchClinic(f, v) {
			out = append(out, v)
		}
	}
	return out
}
