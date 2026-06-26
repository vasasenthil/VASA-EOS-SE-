package integration

import (
	"database/sql"
	"encoding/json"
)

// pgSavingsStore is the durable PostgreSQL adapter for the school bank / student savings passbook.
type pgSavingsStore struct{ db *sql.DB }

func newPgSavingsStore(dsn string) (*pgSavingsStore, error) {
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, err
	}
	if err := db.Ping(); err != nil {
		return nil, err
	}
	s := &pgSavingsStore{db: db}
	if err := s.ensureSchema(); err != nil {
		return nil, err
	}
	return s, nil
}

func (s *pgSavingsStore) ensureSchema() error {
	_, err := s.db.Exec(`
CREATE TABLE IF NOT EXISTS savings_accounts (
    id            TEXT PRIMARY KEY,
    org_unit      TEXT NOT NULL,
    student_id    TEXT NOT NULL,
    balance_paise BIGINT NOT NULL DEFAULT 0,
    frozen        BOOLEAN NOT NULL DEFAULT FALSE,
    transactions  TEXT NOT NULL DEFAULT '[]',
    status        TEXT NOT NULL,
    created_on    TEXT NOT NULL DEFAULT '',
    updated_at    TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS savings_org_idx     ON savings_accounts (org_unit);
CREATE INDEX IF NOT EXISTS savings_status_idx  ON savings_accounts (status);
CREATE INDEX IF NOT EXISTS savings_student_idx ON savings_accounts (student_id);`)
	return err
}

const savingsCols = "id,org_unit,student_id,balance_paise,frozen,transactions,status,created_on,updated_at"

func scanSavings(row interface{ Scan(...any) error }) (SavingsAccount, error) {
	var a SavingsAccount
	var txns string
	err := row.Scan(&a.ID, &a.OrgUnit, &a.StudentID, &a.BalancePaise, &a.Frozen, &txns, &a.Status, &a.CreatedOn, &a.UpdatedAt)
	if err != nil {
		return SavingsAccount{}, err
	}
	if txns != "" && txns != "[]" {
		_ = json.Unmarshal([]byte(txns), &a.Transactions)
	}
	return a, nil
}

func (s *pgSavingsStore) Upsert(a SavingsAccount) (SavingsAccount, error) {
	txns, err := json.Marshal(a.Transactions)
	if err != nil {
		return SavingsAccount{}, err
	}
	if len(a.Transactions) == 0 {
		txns = []byte("[]")
	}
	if _, err := s.db.Exec(`INSERT INTO savings_accounts (`+savingsCols+`)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        ON CONFLICT (id) DO UPDATE SET org_unit=$2,student_id=$3,balance_paise=$4,frozen=$5,transactions=$6,
            status=$7,created_on=$8,updated_at=$9`,
		a.ID, a.OrgUnit, a.StudentID, a.BalancePaise, a.Frozen, string(txns), a.Status, a.CreatedOn, a.UpdatedAt); err != nil {
		return SavingsAccount{}, err
	}
	return a, nil
}

func (s *pgSavingsStore) Get(id string) (SavingsAccount, bool) {
	a, err := scanSavings(s.db.QueryRow(`SELECT `+savingsCols+` FROM savings_accounts WHERE id=$1`, id))
	if err != nil {
		return SavingsAccount{}, false
	}
	return a, true
}

func (s *pgSavingsStore) List(f savingsFilter) []SavingsAccount {
	rows, err := s.db.Query(`SELECT ` + savingsCols + ` FROM savings_accounts`)
	if err != nil {
		return nil
	}
	defer rows.Close()
	var out []SavingsAccount
	for rows.Next() {
		a, err := scanSavings(rows)
		if err != nil {
			continue
		}
		if matchSavings(f, a) {
			out = append(out, a)
		}
	}
	return out
}
