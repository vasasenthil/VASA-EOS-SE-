package integration

import "database/sql"

// pgLPStore is the durable PostgreSQL adapter for the lesson-plan register.
type pgLPStore struct{ db *sql.DB }

func newPgLPStore(dsn string) (*pgLPStore, error) {
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, err
	}
	if err := db.Ping(); err != nil {
		return nil, err
	}
	s := &pgLPStore{db: db}
	if err := s.ensureSchema(); err != nil {
		return nil, err
	}
	return s, nil
}

func (s *pgLPStore) ensureSchema() error {
	_, err := s.db.Exec(`
CREATE TABLE IF NOT EXISTS lesson_plans (
    id          TEXT PRIMARY KEY,
    org_unit    TEXT NOT NULL,
    class       TEXT NOT NULL,
    subject     TEXT NOT NULL,
    teacher_id  TEXT NOT NULL,
    topic       TEXT NOT NULL,
    objectives  TEXT NOT NULL DEFAULT '',
    tags        TEXT NOT NULL DEFAULT '',
    resources   TEXT NOT NULL DEFAULT '',
    periods     INTEGER NOT NULL DEFAULT 1,
    status      TEXT NOT NULL,
    created_on  TEXT NOT NULL DEFAULT '',
    updated_at  TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS lesson_plans_org_idx     ON lesson_plans (org_unit);
CREATE INDEX IF NOT EXISTS lesson_plans_subject_idx ON lesson_plans (subject);
CREATE INDEX IF NOT EXISTS lesson_plans_status_idx  ON lesson_plans (status);`)
	return err
}

const lpCols = "id,org_unit,class,subject,teacher_id,topic,objectives,tags,resources,periods,status,created_on,updated_at"

func scanLP(row interface{ Scan(...any) error }) (LessonPlan, error) {
	var l LessonPlan
	err := row.Scan(&l.ID, &l.OrgUnit, &l.Class, &l.Subject, &l.TeacherID, &l.Topic, &l.Objectives,
		&l.Tags, &l.Resources, &l.Periods, &l.Status, &l.CreatedOn, &l.UpdatedAt)
	return l, err
}

func (s *pgLPStore) Upsert(l LessonPlan) (LessonPlan, error) {
	if _, err := s.db.Exec(`INSERT INTO lesson_plans (`+lpCols+`)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
        ON CONFLICT (id) DO UPDATE SET org_unit=$2,class=$3,subject=$4,teacher_id=$5,topic=$6,objectives=$7,
            tags=$8,resources=$9,periods=$10,status=$11,created_on=$12,updated_at=$13`,
		l.ID, l.OrgUnit, l.Class, l.Subject, l.TeacherID, l.Topic, l.Objectives, l.Tags, l.Resources,
		l.Periods, l.Status, l.CreatedOn, l.UpdatedAt); err != nil {
		return LessonPlan{}, err
	}
	return l, nil
}

func (s *pgLPStore) Get(id string) (LessonPlan, bool) {
	l, err := scanLP(s.db.QueryRow(`SELECT `+lpCols+` FROM lesson_plans WHERE id=$1`, id))
	if err != nil {
		return LessonPlan{}, false
	}
	return l, true
}

func (s *pgLPStore) List(f lpFilter) []LessonPlan {
	rows, err := s.db.Query(`SELECT ` + lpCols + ` FROM lesson_plans`)
	if err != nil {
		return nil
	}
	defer rows.Close()
	var out []LessonPlan
	for rows.Next() {
		l, err := scanLP(rows)
		if err != nil {
			continue
		}
		if matchLP(f, l) {
			out = append(out, l)
		}
	}
	return out
}
