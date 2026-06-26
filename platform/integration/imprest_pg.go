package integration

import (
	"database/sql"
	"encoding/json"
)

// pgImprestStore is the durable PostgreSQL adapter for the petty-cash / imprest book.
type pgImprestStore struct{ db *sql.DB }

func newPgImprestStore(dsn string) (*pgImprestStore, error) {
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, err
	}
	if err := db.Ping(); err != nil {
		return nil, err
	}
	s := &pgImprestStore{db: db}
	if err := s.ensureSchema(); err != nil {
		return nil, err
	}
	return s, nil
}

func (s *pgImprestStore) ensureSchema() error {
	_, err := s.db.Exec(`
CREATE TABLE IF NOT EXISTS imprest_books (
    id               TEXT PRIMARY KEY,
    org_unit         TEXT NOT NULL,
    sanctioned_paise BIGINT NOT NULL,
    cash_paise       BIGINT NOT NULL DEFAULT 0,
    vouchers         TEXT NOT NULL DEFAULT '[]',
    status           TEXT NOT NULL,
    created_on       TEXT NOT NULL DEFAULT '',
    updated_at       TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS imprest_org_idx    ON imprest_books (org_unit);
CREATE INDEX IF NOT EXISTS imprest_status_idx ON imprest_books (status);`)
	return err
}

const imprestCols = "id,org_unit,sanctioned_paise,cash_paise,vouchers,status,created_on,updated_at"

func scanImprest(row interface{ Scan(...any) error }) (ImprestBook, error) {
	var b ImprestBook
	var vouchers string
	err := row.Scan(&b.ID, &b.OrgUnit, &b.SanctionedPaise, &b.CashPaise, &vouchers, &b.Status, &b.CreatedOn, &b.UpdatedAt)
	if err != nil {
		return ImprestBook{}, err
	}
	if vouchers != "" && vouchers != "[]" {
		_ = json.Unmarshal([]byte(vouchers), &b.Vouchers)
	}
	return b, nil
}

func (s *pgImprestStore) Upsert(b ImprestBook) (ImprestBook, error) {
	vouchers, err := json.Marshal(b.Vouchers)
	if err != nil {
		return ImprestBook{}, err
	}
	if len(b.Vouchers) == 0 {
		vouchers = []byte("[]")
	}
	if _, err := s.db.Exec(`INSERT INTO imprest_books (`+imprestCols+`)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        ON CONFLICT (id) DO UPDATE SET org_unit=$2,sanctioned_paise=$3,cash_paise=$4,vouchers=$5,status=$6,
            created_on=$7,updated_at=$8`,
		b.ID, b.OrgUnit, b.SanctionedPaise, b.CashPaise, string(vouchers), b.Status, b.CreatedOn, b.UpdatedAt); err != nil {
		return ImprestBook{}, err
	}
	return b, nil
}

func (s *pgImprestStore) Get(id string) (ImprestBook, bool) {
	b, err := scanImprest(s.db.QueryRow(`SELECT `+imprestCols+` FROM imprest_books WHERE id=$1`, id))
	if err != nil {
		return ImprestBook{}, false
	}
	return b, true
}

func (s *pgImprestStore) List(f imprestFilter) []ImprestBook {
	rows, err := s.db.Query(`SELECT ` + imprestCols + ` FROM imprest_books`)
	if err != nil {
		return nil
	}
	defer rows.Close()
	var out []ImprestBook
	for rows.Next() {
		b, err := scanImprest(rows)
		if err != nil {
			continue
		}
		if matchImprest(f, b) {
			out = append(out, b)
		}
	}
	return out
}
