package integration

import (
	"database/sql"
	"encoding/json"
)

// pgCompStore is the durable PostgreSQL adapter for co-curricular & sports competitions.
type pgCompStore struct{ db *sql.DB }

func newPgCompStore(dsn string) (*pgCompStore, error) {
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, err
	}
	if err := db.Ping(); err != nil {
		return nil, err
	}
	s := &pgCompStore{db: db}
	if err := s.ensureSchema(); err != nil {
		return nil, err
	}
	return s, nil
}

func (s *pgCompStore) ensureSchema() error {
	_, err := s.db.Exec(`
CREATE TABLE IF NOT EXISTS competitions (
    id         TEXT PRIMARY KEY,
    org_unit   TEXT NOT NULL,
    name       TEXT NOT NULL,
    discipline TEXT NOT NULL,
    level      TEXT NOT NULL,
    event_date TEXT NOT NULL DEFAULT '',
    entries    TEXT NOT NULL DEFAULT '[]',
    status     TEXT NOT NULL,
    created_on TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS comp_org_idx    ON competitions (org_unit);
CREATE INDEX IF NOT EXISTS comp_level_idx  ON competitions (level);
CREATE INDEX IF NOT EXISTS comp_status_idx ON competitions (status);`)
	return err
}

const compCols = "id,org_unit,name,discipline,level,event_date,entries,status,created_on,updated_at"

func scanComp(row interface{ Scan(...any) error }) (Competition, error) {
	var c Competition
	var entries string
	err := row.Scan(&c.ID, &c.OrgUnit, &c.Name, &c.Discipline, &c.Level, &c.EventDate, &entries, &c.Status, &c.CreatedOn, &c.UpdatedAt)
	if err != nil {
		return Competition{}, err
	}
	if entries != "" && entries != "[]" {
		_ = json.Unmarshal([]byte(entries), &c.Entries)
	}
	return c, nil
}

func (s *pgCompStore) Upsert(c Competition) (Competition, error) {
	entries, err := json.Marshal(c.Entries)
	if err != nil {
		return Competition{}, err
	}
	if len(c.Entries) == 0 {
		entries = []byte("[]")
	}
	if _, err := s.db.Exec(`INSERT INTO competitions (`+compCols+`)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        ON CONFLICT (id) DO UPDATE SET org_unit=$2,name=$3,discipline=$4,level=$5,event_date=$6,entries=$7,status=$8,created_on=$9,updated_at=$10`,
		c.ID, c.OrgUnit, c.Name, c.Discipline, c.Level, c.EventDate, string(entries), c.Status, c.CreatedOn, c.UpdatedAt); err != nil {
		return Competition{}, err
	}
	return c, nil
}

func (s *pgCompStore) Get(id string) (Competition, bool) {
	c, err := scanComp(s.db.QueryRow(`SELECT `+compCols+` FROM competitions WHERE id=$1`, id))
	if err != nil {
		return Competition{}, false
	}
	return c, true
}

func (s *pgCompStore) List(f compFilter) []Competition {
	rows, err := s.db.Query(`SELECT ` + compCols + ` FROM competitions`)
	if err != nil {
		return nil
	}
	defer rows.Close()
	var out []Competition
	for rows.Next() {
		c, err := scanComp(rows)
		if err != nil {
			continue
		}
		if matchComp(f, c) {
			out = append(out, c)
		}
	}
	return out
}
