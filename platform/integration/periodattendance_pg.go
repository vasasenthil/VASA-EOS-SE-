package integration

import (
	"database/sql"
	"strings"
)

// pgPeriodStore is the durable PostgreSQL adapter for period (lesson-wise) attendance.
type pgPeriodStore struct{ db *sql.DB }

func newPgPeriodStore(dsn string) (*pgPeriodStore, error) {
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, err
	}
	if err := db.Ping(); err != nil {
		return nil, err
	}
	s := &pgPeriodStore{db: db}
	if err := s.ensureSchema(); err != nil {
		return nil, err
	}
	return s, nil
}

func (s *pgPeriodStore) ensureSchema() error {
	_, err := s.db.Exec(`
CREATE TABLE IF NOT EXISTS period_attendance (
    id             TEXT PRIMARY KEY,
    org_unit       TEXT NOT NULL,
    class          TEXT NOT NULL,
    date           TEXT NOT NULL,
    day            TEXT NOT NULL,
    period         INTEGER NOT NULL,
    subject        TEXT NOT NULL,
    teacher_id     TEXT NOT NULL,
    start_t        TEXT NOT NULL DEFAULT '',
    end_t          TEXT NOT NULL DEFAULT '',
    lesson_plan_id TEXT NOT NULL DEFAULT '',
    status         TEXT NOT NULL,
    strength       INTEGER NOT NULL DEFAULT 0,
    present_count  INTEGER NOT NULL DEFAULT 0,
    absentees      TEXT NOT NULL DEFAULT '',
    updated_at     TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS period_org_idx        ON period_attendance (org_unit);
CREATE INDEX IF NOT EXISTS period_class_date_idx ON period_attendance (class, date);
CREATE INDEX IF NOT EXISTS period_subject_idx    ON period_attendance (subject);`)
	return err
}

const periodCols = "id,org_unit,class,date,day,period,subject,teacher_id,start_t,end_t,lesson_plan_id,status,strength,present_count,absentees,updated_at"

func scanPeriod(row interface{ Scan(...any) error }) (PeriodAttendance, error) {
	var r PeriodAttendance
	var absentees string
	err := row.Scan(&r.ID, &r.OrgUnit, &r.Class, &r.Date, &r.Day, &r.Period, &r.Subject, &r.TeacherID,
		&r.Start, &r.End, &r.LessonPlanID, &r.Status, &r.Strength, &r.PresentCount, &absentees, &r.UpdatedAt)
	if err != nil {
		return PeriodAttendance{}, err
	}
	if absentees != "" {
		r.Absentees = strings.Split(absentees, ",")
	}
	return r, nil
}

func (s *pgPeriodStore) Upsert(r PeriodAttendance) (PeriodAttendance, error) {
	absentees := strings.Join(r.Absentees, ",")
	if _, err := s.db.Exec(`INSERT INTO period_attendance (`+periodCols+`)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
        ON CONFLICT (id) DO UPDATE SET org_unit=$2,class=$3,date=$4,day=$5,period=$6,subject=$7,teacher_id=$8,
            start_t=$9,end_t=$10,lesson_plan_id=$11,status=$12,strength=$13,present_count=$14,absentees=$15,updated_at=$16`,
		r.ID, r.OrgUnit, r.Class, r.Date, r.Day, r.Period, r.Subject, r.TeacherID, r.Start, r.End,
		r.LessonPlanID, r.Status, r.Strength, r.PresentCount, absentees, r.UpdatedAt); err != nil {
		return PeriodAttendance{}, err
	}
	return r, nil
}

func (s *pgPeriodStore) Get(id string) (PeriodAttendance, bool) {
	r, err := scanPeriod(s.db.QueryRow(`SELECT `+periodCols+` FROM period_attendance WHERE id=$1`, id))
	if err != nil {
		return PeriodAttendance{}, false
	}
	return r, true
}

func (s *pgPeriodStore) List(f periodFilter) []PeriodAttendance {
	rows, err := s.db.Query(`SELECT ` + periodCols + ` FROM period_attendance`)
	if err != nil {
		return nil
	}
	defer rows.Close()
	var out []PeriodAttendance
	for rows.Next() {
		r, err := scanPeriod(rows)
		if err != nil {
			continue
		}
		if matchPeriod(f, r) {
			out = append(out, r)
		}
	}
	return out
}
