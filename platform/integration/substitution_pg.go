package integration

import "database/sql"

// pgSubStore is the durable PostgreSQL adapter for timetable substitutions.
type pgSubStore struct{ db *sql.DB }

func newPgSubStore(dsn string) (*pgSubStore, error) {
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, err
	}
	if err := db.Ping(); err != nil {
		return nil, err
	}
	s := &pgSubStore{db: db}
	if err := s.ensureSchema(); err != nil {
		return nil, err
	}
	return s, nil
}

func (s *pgSubStore) ensureSchema() error {
	_, err := s.db.Exec(`
CREATE TABLE IF NOT EXISTS substitutions (
    id                 TEXT PRIMARY KEY,
    org_unit           TEXT NOT NULL,
    class              TEXT NOT NULL,
    day                TEXT NOT NULL,
    period             INTEGER NOT NULL,
    date               TEXT NOT NULL,
    subject            TEXT NOT NULL DEFAULT '',
    original_teacher   TEXT NOT NULL DEFAULT '',
    substitute_teacher TEXT NOT NULL,
    reason             TEXT NOT NULL DEFAULT '',
    status             TEXT NOT NULL,
    created_on         TEXT NOT NULL DEFAULT '',
    updated_at         TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS sub_org_idx       ON substitutions (org_unit);
CREATE INDEX IF NOT EXISTS sub_class_date_idx ON substitutions (class, date);`)
	return err
}

const subCols = "id,org_unit,class,day,period,date,subject,original_teacher,substitute_teacher,reason,status,created_on,updated_at"

func scanSub(row interface{ Scan(...any) error }) (Substitution, error) {
	var x Substitution
	err := row.Scan(&x.ID, &x.OrgUnit, &x.Class, &x.Day, &x.Period, &x.Date, &x.Subject, &x.OriginalTeacher,
		&x.SubstituteTeacher, &x.Reason, &x.Status, &x.CreatedOn, &x.UpdatedAt)
	if err != nil {
		return Substitution{}, err
	}
	return x, nil
}

func (s *pgSubStore) Upsert(x Substitution) (Substitution, error) {
	if _, err := s.db.Exec(`INSERT INTO substitutions (`+subCols+`)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
        ON CONFLICT (id) DO UPDATE SET org_unit=$2,class=$3,day=$4,period=$5,date=$6,subject=$7,original_teacher=$8,
            substitute_teacher=$9,reason=$10,status=$11,created_on=$12,updated_at=$13`,
		x.ID, x.OrgUnit, x.Class, x.Day, x.Period, x.Date, x.Subject, x.OriginalTeacher, x.SubstituteTeacher, x.Reason, x.Status, x.CreatedOn, x.UpdatedAt); err != nil {
		return Substitution{}, err
	}
	return x, nil
}

func (s *pgSubStore) Get(id string) (Substitution, bool) {
	x, err := scanSub(s.db.QueryRow(`SELECT `+subCols+` FROM substitutions WHERE id=$1`, id))
	if err != nil {
		return Substitution{}, false
	}
	return x, true
}

func (s *pgSubStore) List(f subFilter) []Substitution {
	rows, err := s.db.Query(`SELECT ` + subCols + ` FROM substitutions`)
	if err != nil {
		return nil
	}
	defer rows.Close()
	var out []Substitution
	for rows.Next() {
		x, err := scanSub(rows)
		if err != nil {
			continue
		}
		if matchSub(f, x) {
			out = append(out, x)
		}
	}
	return out
}
