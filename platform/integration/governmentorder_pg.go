package integration

import (
	"database/sql"
)

// pgGOStore is the durable PostgreSQL adapter for the Government Order register.
type pgGOStore struct{ db *sql.DB }

func newPgGOStore(dsn string) (*pgGOStore, error) {
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, err
	}
	if err := db.Ping(); err != nil {
		return nil, err
	}
	s := &pgGOStore{db: db}
	if err := s.ensureSchema(); err != nil {
		return nil, err
	}
	return s, nil
}

func (s *pgGOStore) ensureSchema() error {
	_, err := s.db.Exec(`
CREATE TABLE IF NOT EXISTS government_orders (
    id           TEXT PRIMARY KEY,
    org_unit     TEXT NOT NULL,
    number       TEXT NOT NULL DEFAULT '',
    department   TEXT NOT NULL,
    category     TEXT NOT NULL,
    subject      TEXT NOT NULL,
    amount_paise BIGINT NOT NULL DEFAULT 0,
    status       TEXT NOT NULL,
    drafted_by   TEXT NOT NULL DEFAULT '',
    vetted_by    TEXT NOT NULL DEFAULT '',
    approved_by  TEXT NOT NULL DEFAULT '',
    reason       TEXT NOT NULL DEFAULT '',
    created_on   TEXT NOT NULL DEFAULT '',
    updated_at   TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS go_org_idx      ON government_orders (org_unit);
CREATE INDEX IF NOT EXISTS go_status_idx   ON government_orders (status);
CREATE INDEX IF NOT EXISTS go_category_idx ON government_orders (category);`)
	return err
}

const goCols = "id,org_unit,number,department,category,subject,amount_paise,status,drafted_by,vetted_by,approved_by,reason,created_on,updated_at"

func scanGO(row interface{ Scan(...any) error }) (GovernmentOrder, error) {
	var o GovernmentOrder
	err := row.Scan(&o.ID, &o.OrgUnit, &o.Number, &o.Department, &o.Category, &o.Subject, &o.AmountPaise, &o.Status,
		&o.DraftedBy, &o.VettedBy, &o.ApprovedBy, &o.Reason, &o.CreatedOn, &o.UpdatedAt)
	if err != nil {
		return GovernmentOrder{}, err
	}
	return o, nil
}

func (s *pgGOStore) Upsert(o GovernmentOrder) (GovernmentOrder, error) {
	if _, err := s.db.Exec(`INSERT INTO government_orders (`+goCols+`)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
        ON CONFLICT (id) DO UPDATE SET org_unit=$2,number=$3,department=$4,category=$5,subject=$6,amount_paise=$7,
            status=$8,drafted_by=$9,vetted_by=$10,approved_by=$11,reason=$12,created_on=$13,updated_at=$14`,
		o.ID, o.OrgUnit, o.Number, o.Department, o.Category, o.Subject, o.AmountPaise, o.Status,
		o.DraftedBy, o.VettedBy, o.ApprovedBy, o.Reason, o.CreatedOn, o.UpdatedAt); err != nil {
		return GovernmentOrder{}, err
	}
	return o, nil
}

func (s *pgGOStore) Get(id string) (GovernmentOrder, bool) {
	o, err := scanGO(s.db.QueryRow(`SELECT `+goCols+` FROM government_orders WHERE id=$1`, id))
	if err != nil {
		return GovernmentOrder{}, false
	}
	return o, true
}

func (s *pgGOStore) List(f goFilter) []GovernmentOrder {
	rows, err := s.db.Query(`SELECT ` + goCols + ` FROM government_orders`)
	if err != nil {
		return nil
	}
	defer rows.Close()
	var out []GovernmentOrder
	for rows.Next() {
		o, err := scanGO(rows)
		if err != nil {
			continue
		}
		if matchGO(f, o) {
			out = append(out, o)
		}
	}
	return out
}
