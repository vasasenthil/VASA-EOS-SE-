package integration

import "database/sql"

// pgStaffAttStore is the durable PostgreSQL adapter for staff attendance (one row per employee per day, upserted).
type pgStaffAttStore struct{ db *sql.DB }

func newPgStaffAttStore(dsn string) (*pgStaffAttStore, error) {
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, err
	}
	if err := db.Ping(); err != nil {
		return nil, err
	}
	s := &pgStaffAttStore{db: db}
	if err := s.ensureSchema(); err != nil {
		return nil, err
	}
	return s, nil
}

func (s *pgStaffAttStore) ensureSchema() error {
	_, err := s.db.Exec(`
CREATE TABLE IF NOT EXISTS staff_attendance (
    employee_id TEXT NOT NULL,
    org_unit    TEXT NOT NULL,
    date        TEXT NOT NULL,
    status      TEXT NOT NULL,
    marked_by   TEXT NOT NULL DEFAULT '',
    marked_at   TEXT NOT NULL DEFAULT '',
    PRIMARY KEY (employee_id, date)
);
CREATE INDEX IF NOT EXISTS staff_att_org_date_idx ON staff_attendance (org_unit, date);
CREATE INDEX IF NOT EXISTS staff_att_emp_idx      ON staff_attendance (employee_id);
CREATE INDEX IF NOT EXISTS staff_att_status_idx   ON staff_attendance (status);`)
	return err
}

const staffAttCols = "employee_id,org_unit,date,status,marked_by,marked_at"

func scanStaffAtt(row interface{ Scan(...any) error }) (StaffAttendance, error) {
	var r StaffAttendance
	err := row.Scan(&r.EmployeeID, &r.OrgUnit, &r.Date, &r.Status, &r.MarkedBy, &r.MarkedAt)
	return r, err
}

func (s *pgStaffAttStore) Mark(r StaffAttendance) (StaffAttendance, error) {
	if _, err := s.db.Exec(`INSERT INTO staff_attendance (`+staffAttCols+`)
        VALUES ($1,$2,$3,$4,$5,$6)
        ON CONFLICT (employee_id, date) DO UPDATE SET org_unit=$2,status=$4,marked_by=$5,marked_at=$6`,
		r.EmployeeID, r.OrgUnit, r.Date, r.Status, r.MarkedBy, r.MarkedAt); err != nil {
		return StaffAttendance{}, err
	}
	return r, nil
}

func (s *pgStaffAttStore) List(f staffAttFilter) []StaffAttendance {
	rows, err := s.db.Query(`SELECT ` + staffAttCols + ` FROM staff_attendance`)
	if err != nil {
		return nil
	}
	defer rows.Close()
	var out []StaffAttendance
	for rows.Next() {
		r, err := scanStaffAtt(rows)
		if err != nil {
			continue
		}
		if matchStaffAtt(f, r) {
			out = append(out, r)
		}
	}
	return out
}
