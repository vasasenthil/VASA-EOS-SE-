package integration

import "database/sql"

// pgVisitorStore is the durable PostgreSQL adapter for visitor & gate management.
type pgVisitorStore struct{ db *sql.DB }

func newPgVisitorStore(dsn string) (*pgVisitorStore, error) {
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, err
	}
	if err := db.Ping(); err != nil {
		return nil, err
	}
	s := &pgVisitorStore{db: db}
	if err := s.ensureSchema(); err != nil {
		return nil, err
	}
	return s, nil
}

func (s *pgVisitorStore) ensureSchema() error {
	_, err := s.db.Exec(`
CREATE TABLE IF NOT EXISTS visitor_passes (
    id           TEXT PRIMARY KEY,
    org_unit     TEXT NOT NULL,
    visitor_id   TEXT NOT NULL,
    name         TEXT NOT NULL,
    purpose      TEXT NOT NULL,
    host         TEXT NOT NULL DEFAULT '',
    check_in_at  TEXT NOT NULL DEFAULT '',
    check_out_at TEXT NOT NULL DEFAULT '',
    status       TEXT NOT NULL,
    created_on   TEXT NOT NULL DEFAULT '',
    updated_at   TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS visitor_org_idx     ON visitor_passes (org_unit);
CREATE INDEX IF NOT EXISTS visitor_status_idx  ON visitor_passes (status);
CREATE INDEX IF NOT EXISTS visitor_visitor_idx ON visitor_passes (visitor_id);`)
	return err
}

const visitorCols = "id,org_unit,visitor_id,name,purpose,host,check_in_at,check_out_at,status,created_on,updated_at"

func scanVisitor(row interface{ Scan(...any) error }) (VisitorPass, error) {
	var v VisitorPass
	err := row.Scan(&v.ID, &v.OrgUnit, &v.VisitorID, &v.Name, &v.Purpose, &v.Host, &v.CheckInAt, &v.CheckOutAt, &v.Status, &v.CreatedOn, &v.UpdatedAt)
	if err != nil {
		return VisitorPass{}, err
	}
	return v, nil
}

func (s *pgVisitorStore) Upsert(v VisitorPass) (VisitorPass, error) {
	if _, err := s.db.Exec(`INSERT INTO visitor_passes (`+visitorCols+`)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        ON CONFLICT (id) DO UPDATE SET org_unit=$2,visitor_id=$3,name=$4,purpose=$5,host=$6,check_in_at=$7,
            check_out_at=$8,status=$9,created_on=$10,updated_at=$11`,
		v.ID, v.OrgUnit, v.VisitorID, v.Name, v.Purpose, v.Host, v.CheckInAt, v.CheckOutAt, v.Status, v.CreatedOn, v.UpdatedAt); err != nil {
		return VisitorPass{}, err
	}
	return v, nil
}

func (s *pgVisitorStore) Get(id string) (VisitorPass, bool) {
	v, err := scanVisitor(s.db.QueryRow(`SELECT `+visitorCols+` FROM visitor_passes WHERE id=$1`, id))
	if err != nil {
		return VisitorPass{}, false
	}
	return v, true
}

func (s *pgVisitorStore) List(f visitorFilter) []VisitorPass {
	rows, err := s.db.Query(`SELECT ` + visitorCols + ` FROM visitor_passes`)
	if err != nil {
		return nil
	}
	defer rows.Close()
	var out []VisitorPass
	for rows.Next() {
		v, err := scanVisitor(rows)
		if err != nil {
			continue
		}
		if matchVisitor(f, v) {
			out = append(out, v)
		}
	}
	return out
}
