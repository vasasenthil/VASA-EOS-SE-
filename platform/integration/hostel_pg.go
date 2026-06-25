package integration

import (
	"database/sql"
	"encoding/json"
)

// pgHostelStore is the durable PostgreSQL adapter for hostel allocation & occupancy.
type pgHostelStore struct{ db *sql.DB }

func newPgHostelStore(dsn string) (*pgHostelStore, error) {
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, err
	}
	if err := db.Ping(); err != nil {
		return nil, err
	}
	s := &pgHostelStore{db: db}
	if err := s.ensureSchema(); err != nil {
		return nil, err
	}
	return s, nil
}

func (s *pgHostelStore) ensureSchema() error {
	_, err := s.db.Exec(`
CREATE TABLE IF NOT EXISTS hostels (
    id         TEXT PRIMARY KEY,
    org_unit   TEXT NOT NULL,
    name       TEXT NOT NULL,
    type       TEXT NOT NULL,
    capacity   INTEGER NOT NULL,
    residents  TEXT NOT NULL DEFAULT '[]',
    status     TEXT NOT NULL,
    created_on TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS hostel_org_idx    ON hostels (org_unit);
CREATE INDEX IF NOT EXISTS hostel_status_idx ON hostels (status);`)
	return err
}

const hostelCols = "id,org_unit,name,type,capacity,residents,status,created_on,updated_at"

func scanHostel(row interface{ Scan(...any) error }) (Hostel, error) {
	var h Hostel
	var residents string
	err := row.Scan(&h.ID, &h.OrgUnit, &h.Name, &h.Type, &h.Capacity, &residents, &h.Status, &h.CreatedOn, &h.UpdatedAt)
	if err != nil {
		return Hostel{}, err
	}
	if residents != "" && residents != "[]" {
		_ = json.Unmarshal([]byte(residents), &h.Residents)
	}
	return h, nil
}

func (s *pgHostelStore) Upsert(h Hostel) (Hostel, error) {
	residents, err := json.Marshal(h.Residents)
	if err != nil {
		return Hostel{}, err
	}
	if len(h.Residents) == 0 {
		residents = []byte("[]")
	}
	if _, err := s.db.Exec(`INSERT INTO hostels (`+hostelCols+`)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        ON CONFLICT (id) DO UPDATE SET org_unit=$2,name=$3,type=$4,capacity=$5,residents=$6,status=$7,created_on=$8,updated_at=$9`,
		h.ID, h.OrgUnit, h.Name, h.Type, h.Capacity, string(residents), h.Status, h.CreatedOn, h.UpdatedAt); err != nil {
		return Hostel{}, err
	}
	return h, nil
}

func (s *pgHostelStore) Get(id string) (Hostel, bool) {
	h, err := scanHostel(s.db.QueryRow(`SELECT `+hostelCols+` FROM hostels WHERE id=$1`, id))
	if err != nil {
		return Hostel{}, false
	}
	return h, true
}

func (s *pgHostelStore) List(f hostelFilter) []Hostel {
	rows, err := s.db.Query(`SELECT ` + hostelCols + ` FROM hostels`)
	if err != nil {
		return nil
	}
	defer rows.Close()
	var out []Hostel
	for rows.Next() {
		h, err := scanHostel(rows)
		if err != nil {
			continue
		}
		if matchHostel(f, h) {
			out = append(out, h)
		}
	}
	return out
}
