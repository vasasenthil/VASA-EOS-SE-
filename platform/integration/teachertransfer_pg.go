package integration

import "database/sql"

// pgTeacherTransferStore is the durable PostgreSQL adapter for teacher transfer & posting requests.
type pgTeacherTransferStore struct{ db *sql.DB }

func newPgTeacherTransferStore(dsn string) (*pgTeacherTransferStore, error) {
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, err
	}
	if err := db.Ping(); err != nil {
		return nil, err
	}
	s := &pgTeacherTransferStore{db: db}
	if err := s.ensureSchema(); err != nil {
		return nil, err
	}
	return s, nil
}

func (s *pgTeacherTransferStore) ensureSchema() error {
	_, err := s.db.Exec(`
CREATE TABLE IF NOT EXISTS teacher_transfers (
    id           TEXT PRIMARY KEY,
    employee_id  TEXT NOT NULL,
    name         TEXT NOT NULL DEFAULT '',
    cadre        TEXT NOT NULL,
    from_org     TEXT NOT NULL,
    to_org       TEXT NOT NULL,
    reason       TEXT NOT NULL,
    status       TEXT NOT NULL,
    note         TEXT NOT NULL DEFAULT '',
    requested_on TEXT NOT NULL DEFAULT '',
    decided_on   TEXT NOT NULL DEFAULT '',
    updated_at   TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS tt_employee_idx ON teacher_transfers (employee_id);
CREATE INDEX IF NOT EXISTS tt_to_org_idx   ON teacher_transfers (to_org);
CREATE INDEX IF NOT EXISTS tt_status_idx   ON teacher_transfers (status);`)
	return err
}

const teacherTransferCols = "id,employee_id,name,cadre,from_org,to_org,reason,status,note,requested_on,decided_on,updated_at"

func scanTeacherTransfer(row interface{ Scan(...any) error }) (TeacherTransfer, error) {
	var t TeacherTransfer
	err := row.Scan(&t.ID, &t.EmployeeID, &t.Name, &t.Cadre, &t.FromOrg, &t.ToOrg, &t.Reason, &t.Status,
		&t.Note, &t.RequestedOn, &t.DecidedOn, &t.UpdatedAt)
	if err != nil {
		return TeacherTransfer{}, err
	}
	return t, nil
}

func (s *pgTeacherTransferStore) Upsert(t TeacherTransfer) (TeacherTransfer, error) {
	if _, err := s.db.Exec(`INSERT INTO teacher_transfers (`+teacherTransferCols+`)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
        ON CONFLICT (id) DO UPDATE SET employee_id=$2,name=$3,cadre=$4,from_org=$5,to_org=$6,reason=$7,
            status=$8,note=$9,requested_on=$10,decided_on=$11,updated_at=$12`,
		t.ID, t.EmployeeID, t.Name, t.Cadre, t.FromOrg, t.ToOrg, t.Reason, t.Status, t.Note, t.RequestedOn, t.DecidedOn, t.UpdatedAt); err != nil {
		return TeacherTransfer{}, err
	}
	return t, nil
}

func (s *pgTeacherTransferStore) Get(id string) (TeacherTransfer, bool) {
	t, err := scanTeacherTransfer(s.db.QueryRow(`SELECT `+teacherTransferCols+` FROM teacher_transfers WHERE id=$1`, id))
	if err != nil {
		return TeacherTransfer{}, false
	}
	return t, true
}

func (s *pgTeacherTransferStore) List(f teacherTransferFilter) []TeacherTransfer {
	rows, err := s.db.Query(`SELECT ` + teacherTransferCols + ` FROM teacher_transfers`)
	if err != nil {
		return nil
	}
	defer rows.Close()
	var out []TeacherTransfer
	for rows.Next() {
		t, err := scanTeacherTransfer(rows)
		if err != nil {
			continue
		}
		if matchTeacherTransfer(f, t) {
			out = append(out, t)
		}
	}
	return out
}
