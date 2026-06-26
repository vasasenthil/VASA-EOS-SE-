package integration

import "database/sql"

// pgIndentStore is the durable PostgreSQL adapter for textbook/uniform indents.
type pgIndentStore struct{ db *sql.DB }

func newPgIndentStore(dsn string) (*pgIndentStore, error) {
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, err
	}
	if err := db.Ping(); err != nil {
		return nil, err
	}
	s := &pgIndentStore{db: db}
	if err := s.ensureSchema(); err != nil {
		return nil, err
	}
	return s, nil
}

func (s *pgIndentStore) ensureSchema() error {
	_, err := s.db.Exec(`
CREATE TABLE IF NOT EXISTS textbook_indents (
    id           TEXT PRIMARY KEY,
    org_unit     TEXT NOT NULL,
    item         TEXT NOT NULL,
    entitled_qty INTEGER NOT NULL,
    indented_qty INTEGER NOT NULL,
    approved_qty INTEGER NOT NULL DEFAULT 0,
    supplied_qty INTEGER NOT NULL DEFAULT 0,
    status       TEXT NOT NULL,
    created_on   TEXT NOT NULL DEFAULT '',
    updated_at   TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS indent_org_idx    ON textbook_indents (org_unit);
CREATE INDEX IF NOT EXISTS indent_status_idx ON textbook_indents (status);`)
	return err
}

const indentCols = "id,org_unit,item,entitled_qty,indented_qty,approved_qty,supplied_qty,status,created_on,updated_at"

func scanIndent(row interface{ Scan(...any) error }) (TextbookIndent, error) {
	var in TextbookIndent
	err := row.Scan(&in.ID, &in.OrgUnit, &in.Item, &in.EntitledQty, &in.IndentedQty, &in.ApprovedQty, &in.SuppliedQty, &in.Status, &in.CreatedOn, &in.UpdatedAt)
	if err != nil {
		return TextbookIndent{}, err
	}
	return in, nil
}

func (s *pgIndentStore) Upsert(in TextbookIndent) (TextbookIndent, error) {
	if _, err := s.db.Exec(`INSERT INTO textbook_indents (`+indentCols+`)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        ON CONFLICT (id) DO UPDATE SET org_unit=$2,item=$3,entitled_qty=$4,indented_qty=$5,approved_qty=$6,
            supplied_qty=$7,status=$8,created_on=$9,updated_at=$10`,
		in.ID, in.OrgUnit, in.Item, in.EntitledQty, in.IndentedQty, in.ApprovedQty, in.SuppliedQty, in.Status, in.CreatedOn, in.UpdatedAt); err != nil {
		return TextbookIndent{}, err
	}
	return in, nil
}

func (s *pgIndentStore) Get(id string) (TextbookIndent, bool) {
	in, err := scanIndent(s.db.QueryRow(`SELECT `+indentCols+` FROM textbook_indents WHERE id=$1`, id))
	if err != nil {
		return TextbookIndent{}, false
	}
	return in, true
}

func (s *pgIndentStore) List(f indentFilter) []TextbookIndent {
	rows, err := s.db.Query(`SELECT ` + indentCols + ` FROM textbook_indents`)
	if err != nil {
		return nil
	}
	defer rows.Close()
	var out []TextbookIndent
	for rows.Next() {
		in, err := scanIndent(rows)
		if err != nil {
			continue
		}
		if matchIndent(f, in) {
			out = append(out, in)
		}
	}
	return out
}
