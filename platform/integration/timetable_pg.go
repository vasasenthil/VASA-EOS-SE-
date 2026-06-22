package integration

import (
	"database/sql"
	"errors"

	"github.com/vasa-eos-se-tn/platform/timetable"
)

// pgTtStore is the durable PostgreSQL adapter for the timetable. The teacher-clash invariant is enforced with a
// targeted SQL existence check before the upsert.
type pgTtStore struct{ db *sql.DB }

func newPgTtStore(dsn string) (*pgTtStore, error) {
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, err
	}
	if err := db.Ping(); err != nil {
		return nil, err
	}
	s := &pgTtStore{db: db}
	if err := s.ensureSchema(); err != nil {
		return nil, err
	}
	return s, nil
}

func (s *pgTtStore) ensureSchema() error {
	_, err := s.db.Exec(`
CREATE TABLE IF NOT EXISTS timetable_slots (
    org_unit   TEXT NOT NULL,
    class      TEXT NOT NULL,
    day        TEXT NOT NULL,
    period     INT  NOT NULL,
    subject    TEXT NOT NULL,
    teacher_id TEXT NOT NULL,
    PRIMARY KEY (org_unit, class, day, period)
);
CREATE INDEX IF NOT EXISTS timetable_teacher_idx ON timetable_slots (teacher_id, day, period);`)
	return err
}

const ttCols = "org_unit,class,day,period,subject,teacher_id"

func scanSlot(row interface{ Scan(...any) error }) (timetable.Slot, error) {
	var sl timetable.Slot
	err := row.Scan(&sl.OrgUnit, &sl.Class, &sl.Day, &sl.Period, &sl.Subject, &sl.TeacherID)
	return sl, err
}

// Set validates, checks the teacher-clash invariant in SQL, then upserts the class-slot.
func (s *pgTtStore) Set(slot timetable.Slot) (timetable.Slot, error) {
	if err := slot.Validate(); err != nil {
		return timetable.Slot{}, err
	}
	var clashClass string
	err := s.db.QueryRow(`SELECT class FROM timetable_slots
        WHERE org_unit=$1 AND teacher_id=$2 AND day=$3 AND period=$4 AND class<>$5 LIMIT 1`,
		slot.OrgUnit, slot.TeacherID, slot.Day, slot.Period, slot.Class).Scan(&clashClass)
	if err == nil {
		return timetable.Slot{}, errors.New("timetable: teacher " + slot.TeacherID + " is already teaching " + clashClass + " at " + slot.Day)
	} else if err != sql.ErrNoRows {
		return timetable.Slot{}, err
	}
	if _, err := s.db.Exec(`INSERT INTO timetable_slots (`+ttCols+`)
        VALUES ($1,$2,$3,$4,$5,$6)
        ON CONFLICT (org_unit, class, day, period) DO UPDATE SET subject=$5,teacher_id=$6`,
		slot.OrgUnit, slot.Class, slot.Day, slot.Period, slot.Subject, slot.TeacherID); err != nil {
		return timetable.Slot{}, err
	}
	return slot, nil
}

func (s *pgTtStore) Get(class, day string, period int) (timetable.Slot, bool) {
	sl, err := scanSlot(s.db.QueryRow(`SELECT `+ttCols+` FROM timetable_slots WHERE class=$1 AND day=$2 AND period=$3`, class, day, period))
	if err != nil {
		return timetable.Slot{}, false
	}
	return sl, true
}

func (s *pgTtStore) Clear(class, day string, period int) bool {
	res, err := s.db.Exec(`DELETE FROM timetable_slots WHERE class=$1 AND day=$2 AND period=$3`, class, day, period)
	if err != nil {
		return false
	}
	n, _ := res.RowsAffected()
	return n > 0
}

func (s *pgTtStore) List(f timetable.Filter) []timetable.Slot {
	rows, err := s.db.Query(`SELECT ` + ttCols + ` FROM timetable_slots ORDER BY day, period, class`)
	if err != nil {
		return nil
	}
	defer rows.Close()
	var out []timetable.Slot
	for rows.Next() {
		sl, err := scanSlot(rows)
		if err != nil {
			continue
		}
		if timetable.Match(f, sl) {
			out = append(out, sl)
		}
	}
	return out
}
