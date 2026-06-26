package integration

import (
	"database/sql"
	"encoding/json"
)

// pgWaterStore is the durable PostgreSQL adapter for drinking-water quality testing.
type pgWaterStore struct{ db *sql.DB }

func newPgWaterStore(dsn string) (*pgWaterStore, error) {
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, err
	}
	if err := db.Ping(); err != nil {
		return nil, err
	}
	s := &pgWaterStore{db: db}
	if err := s.ensureSchema(); err != nil {
		return nil, err
	}
	return s, nil
}

func (s *pgWaterStore) ensureSchema() error {
	_, err := s.db.Exec(`
CREATE TABLE IF NOT EXISTS water_tests (
    id          TEXT PRIMARY KEY,
    org_unit    TEXT NOT NULL,
    source      TEXT NOT NULL,
    sample_date TEXT NOT NULL DEFAULT '',
    parameters  TEXT NOT NULL DEFAULT '[]',
    status      TEXT NOT NULL,
    tested_on   TEXT NOT NULL DEFAULT '',
    remarks     TEXT NOT NULL DEFAULT '',
    created_on  TEXT NOT NULL DEFAULT '',
    updated_at  TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS water_org_idx    ON water_tests (org_unit);
CREATE INDEX IF NOT EXISTS water_status_idx ON water_tests (status);`)
	return err
}

const waterCols = "id,org_unit,source,sample_date,parameters,status,tested_on,remarks,created_on,updated_at"

func scanWater(row interface{ Scan(...any) error }) (WaterTest, error) {
	var t WaterTest
	var params string
	err := row.Scan(&t.ID, &t.OrgUnit, &t.Source, &t.SampleDate, &params, &t.Status, &t.TestedOn, &t.Remarks, &t.CreatedOn, &t.UpdatedAt)
	if err != nil {
		return WaterTest{}, err
	}
	if params != "" && params != "[]" {
		_ = json.Unmarshal([]byte(params), &t.Parameters)
	}
	return t, nil
}

func (s *pgWaterStore) Upsert(t WaterTest) (WaterTest, error) {
	params, err := json.Marshal(t.Parameters)
	if err != nil {
		return WaterTest{}, err
	}
	if len(t.Parameters) == 0 {
		params = []byte("[]")
	}
	if _, err := s.db.Exec(`INSERT INTO water_tests (`+waterCols+`)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        ON CONFLICT (id) DO UPDATE SET org_unit=$2,source=$3,sample_date=$4,parameters=$5,status=$6,
            tested_on=$7,remarks=$8,created_on=$9,updated_at=$10`,
		t.ID, t.OrgUnit, t.Source, t.SampleDate, string(params), t.Status, t.TestedOn, t.Remarks, t.CreatedOn, t.UpdatedAt); err != nil {
		return WaterTest{}, err
	}
	return t, nil
}

func (s *pgWaterStore) Get(id string) (WaterTest, bool) {
	t, err := scanWater(s.db.QueryRow(`SELECT `+waterCols+` FROM water_tests WHERE id=$1`, id))
	if err != nil {
		return WaterTest{}, false
	}
	return t, true
}

func (s *pgWaterStore) List(f waterFilter) []WaterTest {
	rows, err := s.db.Query(`SELECT ` + waterCols + ` FROM water_tests`)
	if err != nil {
		return nil
	}
	defer rows.Close()
	var out []WaterTest
	for rows.Next() {
		t, err := scanWater(rows)
		if err != nil {
			continue
		}
		if matchWater(f, t) {
			out = append(out, t)
		}
	}
	return out
}
