package integration

import (
	"database/sql"
	"encoding/json"
)

// pgFitnessStore is the durable PostgreSQL adapter for the vehicle fitness / transport-safety register.
type pgFitnessStore struct{ db *sql.DB }

func newPgFitnessStore(dsn string) (*pgFitnessStore, error) {
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, err
	}
	if err := db.Ping(); err != nil {
		return nil, err
	}
	s := &pgFitnessStore{db: db}
	if err := s.ensureSchema(); err != nil {
		return nil, err
	}
	return s, nil
}

func (s *pgFitnessStore) ensureSchema() error {
	_, err := s.db.Exec(`
CREATE TABLE IF NOT EXISTS fitness_vehicles (
    id         TEXT PRIMARY KEY,
    org_unit   TEXT NOT NULL,
    reg_no     TEXT NOT NULL,
    documents  TEXT NOT NULL DEFAULT '[]',
    status     TEXT NOT NULL,
    created_on TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS fitness_org_idx    ON fitness_vehicles (org_unit);
CREATE INDEX IF NOT EXISTS fitness_status_idx ON fitness_vehicles (status);`)
	return err
}

const fitnessCols = "id,org_unit,reg_no,documents,status,created_on,updated_at"

func scanFitness(row interface{ Scan(...any) error }) (FitnessVehicle, error) {
	var v FitnessVehicle
	var docs string
	err := row.Scan(&v.ID, &v.OrgUnit, &v.RegNo, &docs, &v.Status, &v.CreatedOn, &v.UpdatedAt)
	if err != nil {
		return FitnessVehicle{}, err
	}
	if docs != "" && docs != "[]" {
		_ = json.Unmarshal([]byte(docs), &v.Documents)
	}
	return v, nil
}

func (s *pgFitnessStore) Upsert(v FitnessVehicle) (FitnessVehicle, error) {
	docs, err := json.Marshal(v.Documents)
	if err != nil {
		return FitnessVehicle{}, err
	}
	if len(v.Documents) == 0 {
		docs = []byte("[]")
	}
	if _, err := s.db.Exec(`INSERT INTO fitness_vehicles (`+fitnessCols+`)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        ON CONFLICT (id) DO UPDATE SET org_unit=$2,reg_no=$3,documents=$4,status=$5,created_on=$6,updated_at=$7`,
		v.ID, v.OrgUnit, v.RegNo, string(docs), v.Status, v.CreatedOn, v.UpdatedAt); err != nil {
		return FitnessVehicle{}, err
	}
	return v, nil
}

func (s *pgFitnessStore) Get(id string) (FitnessVehicle, bool) {
	v, err := scanFitness(s.db.QueryRow(`SELECT `+fitnessCols+` FROM fitness_vehicles WHERE id=$1`, id))
	if err != nil {
		return FitnessVehicle{}, false
	}
	return v, true
}

func (s *pgFitnessStore) List(f fitnessFilter) []FitnessVehicle {
	rows, err := s.db.Query(`SELECT ` + fitnessCols + ` FROM fitness_vehicles`)
	if err != nil {
		return nil
	}
	defer rows.Close()
	var out []FitnessVehicle
	for rows.Next() {
		v, err := scanFitness(rows)
		if err != nil {
			continue
		}
		if matchFitness(f, v) {
			out = append(out, v)
		}
	}
	return out
}
