package integration

import "database/sql"

// pgInspStore is the durable PostgreSQL adapter for the school inspection & monitoring register.
type pgInspStore struct{ db *sql.DB }

func newPgInspStore(dsn string) (*pgInspStore, error) {
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, err
	}
	if err := db.Ping(); err != nil {
		return nil, err
	}
	s := &pgInspStore{db: db}
	if err := s.ensureSchema(); err != nil {
		return nil, err
	}
	return s, nil
}

func (s *pgInspStore) ensureSchema() error {
	_, err := s.db.Exec(`
CREATE TABLE IF NOT EXISTS inspections (
    id               TEXT PRIMARY KEY,
    org_unit         TEXT NOT NULL,
    type             TEXT NOT NULL,
    inspector_id     TEXT NOT NULL,
    visited_on       TEXT NOT NULL,
    compliance_score INTEGER NOT NULL DEFAULT 0,
    findings         TEXT NOT NULL DEFAULT '',
    status           TEXT NOT NULL,
    action_note      TEXT NOT NULL DEFAULT '',
    closed_on        TEXT NOT NULL DEFAULT '',
    updated_at       TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS inspections_org_idx    ON inspections (org_unit);
CREATE INDEX IF NOT EXISTS inspections_status_idx ON inspections (status);`)
	return err
}

const inspCols = "id,org_unit,type,inspector_id,visited_on,compliance_score,findings,status,action_note,closed_on,updated_at"

func scanInsp(row interface{ Scan(...any) error }) (Inspection, error) {
	var i Inspection
	err := row.Scan(&i.ID, &i.OrgUnit, &i.Type, &i.InspectorID, &i.VisitedOn, &i.ComplianceScore,
		&i.Findings, &i.Status, &i.ActionNote, &i.ClosedOn, &i.UpdatedAt)
	return i, err
}

func (s *pgInspStore) Upsert(i Inspection) (Inspection, error) {
	if _, err := s.db.Exec(`INSERT INTO inspections (`+inspCols+`)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        ON CONFLICT (id) DO UPDATE SET org_unit=$2,type=$3,inspector_id=$4,visited_on=$5,compliance_score=$6,
            findings=$7,status=$8,action_note=$9,closed_on=$10,updated_at=$11`,
		i.ID, i.OrgUnit, i.Type, i.InspectorID, i.VisitedOn, i.ComplianceScore, i.Findings, i.Status,
		i.ActionNote, i.ClosedOn, i.UpdatedAt); err != nil {
		return Inspection{}, err
	}
	return i, nil
}

func (s *pgInspStore) Get(id string) (Inspection, bool) {
	i, err := scanInsp(s.db.QueryRow(`SELECT `+inspCols+` FROM inspections WHERE id=$1`, id))
	if err != nil {
		return Inspection{}, false
	}
	return i, true
}

func (s *pgInspStore) List(f inspFilter) []Inspection {
	rows, err := s.db.Query(`SELECT ` + inspCols + ` FROM inspections`)
	if err != nil {
		return nil
	}
	defer rows.Close()
	var out []Inspection
	for rows.Next() {
		i, err := scanInsp(rows)
		if err != nil {
			continue
		}
		if matchInsp(f, i) {
			out = append(out, i)
		}
	}
	return out
}
