package integration

import "database/sql"

// pgDisciplinaryStore is the durable PostgreSQL adapter for staff disciplinary / vigilance cases.
type pgDisciplinaryStore struct{ db *sql.DB }

func newPgDisciplinaryStore(dsn string) (*pgDisciplinaryStore, error) {
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, err
	}
	if err := db.Ping(); err != nil {
		return nil, err
	}
	s := &pgDisciplinaryStore{db: db}
	if err := s.ensureSchema(); err != nil {
		return nil, err
	}
	return s, nil
}

func (s *pgDisciplinaryStore) ensureSchema() error {
	_, err := s.db.Exec(`
CREATE TABLE IF NOT EXISTS disciplinary_cases (
    id               TEXT PRIMARY KEY,
    org_unit         TEXT NOT NULL,
    employee_id      TEXT NOT NULL,
    charge           TEXT NOT NULL,
    inquiry_findings TEXT NOT NULL DEFAULT '',
    penalty          TEXT NOT NULL DEFAULT '',
    appeal_grounds   TEXT NOT NULL DEFAULT '',
    appealed         BOOLEAN NOT NULL DEFAULT FALSE,
    stage            TEXT NOT NULL,
    created_on       TEXT NOT NULL DEFAULT '',
    updated_at       TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS disc_org_idx   ON disciplinary_cases (org_unit);
CREATE INDEX IF NOT EXISTS disc_stage_idx ON disciplinary_cases (stage);`)
	return err
}

const disciplinaryCols = "id,org_unit,employee_id,charge,inquiry_findings,penalty,appeal_grounds,appealed,stage,created_on,updated_at"

func scanDisciplinary(row interface{ Scan(...any) error }) (DisciplinaryCase, error) {
	var c DisciplinaryCase
	err := row.Scan(&c.ID, &c.OrgUnit, &c.EmployeeID, &c.Charge, &c.InquiryFindings, &c.Penalty, &c.AppealGrounds, &c.Appealed, &c.Stage, &c.CreatedOn, &c.UpdatedAt)
	if err != nil {
		return DisciplinaryCase{}, err
	}
	return c, nil
}

func (s *pgDisciplinaryStore) Upsert(c DisciplinaryCase) (DisciplinaryCase, error) {
	if _, err := s.db.Exec(`INSERT INTO disciplinary_cases (`+disciplinaryCols+`)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        ON CONFLICT (id) DO UPDATE SET org_unit=$2,employee_id=$3,charge=$4,inquiry_findings=$5,penalty=$6,
            appeal_grounds=$7,appealed=$8,stage=$9,created_on=$10,updated_at=$11`,
		c.ID, c.OrgUnit, c.EmployeeID, c.Charge, c.InquiryFindings, c.Penalty, c.AppealGrounds, c.Appealed, c.Stage, c.CreatedOn, c.UpdatedAt); err != nil {
		return DisciplinaryCase{}, err
	}
	return c, nil
}

func (s *pgDisciplinaryStore) Get(id string) (DisciplinaryCase, bool) {
	c, err := scanDisciplinary(s.db.QueryRow(`SELECT `+disciplinaryCols+` FROM disciplinary_cases WHERE id=$1`, id))
	if err != nil {
		return DisciplinaryCase{}, false
	}
	return c, true
}

func (s *pgDisciplinaryStore) List(f disciplinaryFilter) []DisciplinaryCase {
	rows, err := s.db.Query(`SELECT ` + disciplinaryCols + ` FROM disciplinary_cases`)
	if err != nil {
		return nil
	}
	defer rows.Close()
	var out []DisciplinaryCase
	for rows.Next() {
		c, err := scanDisciplinary(rows)
		if err != nil {
			continue
		}
		if matchDisciplinary(f, c) {
			out = append(out, c)
		}
	}
	return out
}
