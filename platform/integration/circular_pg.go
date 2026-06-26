package integration

import (
	"database/sql"
	"encoding/json"
)

// pgCircularStore is the durable PostgreSQL adapter for notice board & circulars.
type pgCircularStore struct{ db *sql.DB }

func newPgCircularStore(dsn string) (*pgCircularStore, error) {
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, err
	}
	if err := db.Ping(); err != nil {
		return nil, err
	}
	s := &pgCircularStore{db: db}
	if err := s.ensureSchema(); err != nil {
		return nil, err
	}
	return s, nil
}

func (s *pgCircularStore) ensureSchema() error {
	_, err := s.db.Exec(`
CREATE TABLE IF NOT EXISTS circulars (
    id           TEXT PRIMARY KEY,
    org_unit     TEXT NOT NULL,
    title        TEXT NOT NULL,
    category     TEXT NOT NULL,
    summary      TEXT NOT NULL DEFAULT '',
    target_count INTEGER NOT NULL DEFAULT 1,
    acks         TEXT NOT NULL DEFAULT '[]',
    status       TEXT NOT NULL,
    published_on TEXT NOT NULL DEFAULT '',
    created_on   TEXT NOT NULL DEFAULT '',
    updated_at   TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS circular_org_idx    ON circulars (org_unit);
CREATE INDEX IF NOT EXISTS circular_status_idx ON circulars (status);`)
	return err
}

const circularCols = "id,org_unit,title,category,summary,target_count,acks,status,published_on,created_on,updated_at"

func scanCircular(row interface{ Scan(...any) error }) (Circular, error) {
	var c Circular
	var acks string
	err := row.Scan(&c.ID, &c.OrgUnit, &c.Title, &c.Category, &c.Summary, &c.TargetCount, &acks, &c.Status, &c.PublishedOn, &c.CreatedOn, &c.UpdatedAt)
	if err != nil {
		return Circular{}, err
	}
	if acks != "" && acks != "[]" {
		_ = json.Unmarshal([]byte(acks), &c.Acks)
	}
	return c, nil
}

func (s *pgCircularStore) Upsert(c Circular) (Circular, error) {
	acks, err := json.Marshal(c.Acks)
	if err != nil {
		return Circular{}, err
	}
	if len(c.Acks) == 0 {
		acks = []byte("[]")
	}
	if _, err := s.db.Exec(`INSERT INTO circulars (`+circularCols+`)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        ON CONFLICT (id) DO UPDATE SET org_unit=$2,title=$3,category=$4,summary=$5,target_count=$6,acks=$7,
            status=$8,published_on=$9,created_on=$10,updated_at=$11`,
		c.ID, c.OrgUnit, c.Title, c.Category, c.Summary, c.TargetCount, string(acks), c.Status, c.PublishedOn, c.CreatedOn, c.UpdatedAt); err != nil {
		return Circular{}, err
	}
	return c, nil
}

func (s *pgCircularStore) Get(id string) (Circular, bool) {
	c, err := scanCircular(s.db.QueryRow(`SELECT `+circularCols+` FROM circulars WHERE id=$1`, id))
	if err != nil {
		return Circular{}, false
	}
	return c, true
}

func (s *pgCircularStore) List(f circularFilter) []Circular {
	rows, err := s.db.Query(`SELECT ` + circularCols + ` FROM circulars`)
	if err != nil {
		return nil
	}
	defer rows.Close()
	var out []Circular
	for rows.Next() {
		c, err := scanCircular(rows)
		if err != nil {
			continue
		}
		if matchCircular(f, c) {
			out = append(out, c)
		}
	}
	return out
}
