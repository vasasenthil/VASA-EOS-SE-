package integration

import "database/sql"

// pgGrantStore is the durable PostgreSQL adapter for the school grant utilisation register.
type pgGrantStore struct{ db *sql.DB }

func newPgGrantStore(dsn string) (*pgGrantStore, error) {
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, err
	}
	if err := db.Ping(); err != nil {
		return nil, err
	}
	s := &pgGrantStore{db: db}
	if err := s.ensureSchema(); err != nil {
		return nil, err
	}
	return s, nil
}

func (s *pgGrantStore) ensureSchema() error {
	_, err := s.db.Exec(`
CREATE TABLE IF NOT EXISTS grants (
    id              TEXT PRIMARY KEY,
    org_unit        TEXT NOT NULL,
    head            TEXT NOT NULL,
    allocated_paise BIGINT NOT NULL DEFAULT 0,
    spent_paise     BIGINT NOT NULL DEFAULT 0,
    year            INTEGER NOT NULL DEFAULT 0,
    status          TEXT NOT NULL,
    updated_at      TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS grants_org_idx    ON grants (org_unit);
CREATE INDEX IF NOT EXISTS grants_status_idx ON grants (status);`)
	return err
}

const grantCols = "id,org_unit,head,allocated_paise,spent_paise,year,status,updated_at"

func scanGrant(row interface{ Scan(...any) error }) (Grant, error) {
	var g Grant
	err := row.Scan(&g.ID, &g.OrgUnit, &g.Head, &g.AllocatedPaise, &g.SpentPaise, &g.Year, &g.Status, &g.UpdatedAt)
	return g, err
}

func (s *pgGrantStore) Upsert(g Grant) (Grant, error) {
	if _, err := s.db.Exec(`INSERT INTO grants (`+grantCols+`)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        ON CONFLICT (id) DO UPDATE SET org_unit=$2,head=$3,allocated_paise=$4,spent_paise=$5,year=$6,status=$7,updated_at=$8`,
		g.ID, g.OrgUnit, g.Head, g.AllocatedPaise, g.SpentPaise, g.Year, g.Status, g.UpdatedAt); err != nil {
		return Grant{}, err
	}
	return g, nil
}

func (s *pgGrantStore) Get(id string) (Grant, bool) {
	g, err := scanGrant(s.db.QueryRow(`SELECT `+grantCols+` FROM grants WHERE id=$1`, id))
	if err != nil {
		return Grant{}, false
	}
	return g, true
}

func (s *pgGrantStore) List(f grantFilter) []Grant {
	rows, err := s.db.Query(`SELECT ` + grantCols + ` FROM grants`)
	if err != nil {
		return nil
	}
	defer rows.Close()
	var out []Grant
	for rows.Next() {
		g, err := scanGrant(rows)
		if err != nil {
			continue
		}
		if matchGrant(f, g) {
			out = append(out, g)
		}
	}
	return out
}
