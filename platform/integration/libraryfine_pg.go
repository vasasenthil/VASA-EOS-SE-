package integration

import (
	"database/sql"
	"encoding/json"
)

// pgFineStore is the durable PostgreSQL adapter for the library fine ledger.
type pgFineStore struct{ db *sql.DB }

func newPgFineStore(dsn string) (*pgFineStore, error) {
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, err
	}
	if err := db.Ping(); err != nil {
		return nil, err
	}
	s := &pgFineStore{db: db}
	if err := s.ensureSchema(); err != nil {
		return nil, err
	}
	return s, nil
}

func (s *pgFineStore) ensureSchema() error {
	_, err := s.db.Exec(`
CREATE TABLE IF NOT EXISTS library_fines (
    id                    TEXT PRIMARY KEY,
    org_unit              TEXT NOT NULL,
    member_id             TEXT NOT NULL,
    block_threshold_paise BIGINT NOT NULL DEFAULT 0,
    fines                 TEXT NOT NULL DEFAULT '[]',
    created_on            TEXT NOT NULL DEFAULT '',
    updated_at            TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS libfine_org_idx    ON library_fines (org_unit);
CREATE INDEX IF NOT EXISTS libfine_member_idx ON library_fines (member_id);`)
	return err
}

const fineCols = "id,org_unit,member_id,block_threshold_paise,fines,created_on,updated_at"

func scanFine(row interface{ Scan(...any) error }) (MemberFines, error) {
	var m MemberFines
	var fines string
	err := row.Scan(&m.ID, &m.OrgUnit, &m.MemberID, &m.BlockThresholdPaise, &fines, &m.CreatedOn, &m.UpdatedAt)
	if err != nil {
		return MemberFines{}, err
	}
	if fines != "" && fines != "[]" {
		_ = json.Unmarshal([]byte(fines), &m.Fines)
	}
	return m, nil
}

func (s *pgFineStore) Upsert(m MemberFines) (MemberFines, error) {
	fines, err := json.Marshal(m.Fines)
	if err != nil {
		return MemberFines{}, err
	}
	if len(m.Fines) == 0 {
		fines = []byte("[]")
	}
	if _, err := s.db.Exec(`INSERT INTO library_fines (`+fineCols+`)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        ON CONFLICT (id) DO UPDATE SET org_unit=$2,member_id=$3,block_threshold_paise=$4,fines=$5,
            created_on=$6,updated_at=$7`,
		m.ID, m.OrgUnit, m.MemberID, m.BlockThresholdPaise, string(fines), m.CreatedOn, m.UpdatedAt); err != nil {
		return MemberFines{}, err
	}
	return m, nil
}

func (s *pgFineStore) Get(id string) (MemberFines, bool) {
	m, err := scanFine(s.db.QueryRow(`SELECT `+fineCols+` FROM library_fines WHERE id=$1`, id))
	if err != nil {
		return MemberFines{}, false
	}
	return m, true
}

func (s *pgFineStore) List(f fineFilter) []MemberFines {
	rows, err := s.db.Query(`SELECT ` + fineCols + ` FROM library_fines`)
	if err != nil {
		return nil
	}
	defer rows.Close()
	var out []MemberFines
	for rows.Next() {
		m, err := scanFine(rows)
		if err != nil {
			continue
		}
		if matchFine(f, m) {
			out = append(out, m)
		}
	}
	return out
}
