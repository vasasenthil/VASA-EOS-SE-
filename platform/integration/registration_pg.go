package integration

import (
	"database/sql"
	"encoding/json"
)

// pgEventStore is the durable PostgreSQL adapter for co-curricular event registration.
type pgEventStore struct{ db *sql.DB }

func newPgEventStore(dsn string) (*pgEventStore, error) {
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, err
	}
	if err := db.Ping(); err != nil {
		return nil, err
	}
	s := &pgEventStore{db: db}
	if err := s.ensureSchema(); err != nil {
		return nil, err
	}
	return s, nil
}

func (s *pgEventStore) ensureSchema() error {
	_, err := s.db.Exec(`
CREATE TABLE IF NOT EXISTS activity_events (
    id            TEXT PRIMARY KEY,
    org_unit      TEXT NOT NULL,
    name          TEXT NOT NULL,
    category      TEXT NOT NULL,
    seat_cap      INTEGER NOT NULL,
    event_date    TEXT NOT NULL DEFAULT '',
    registrations TEXT NOT NULL DEFAULT '[]',
    next_seq      INTEGER NOT NULL DEFAULT 1,
    status        TEXT NOT NULL,
    created_on    TEXT NOT NULL DEFAULT '',
    updated_at    TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS event_org_idx    ON activity_events (org_unit);
CREATE INDEX IF NOT EXISTS event_status_idx ON activity_events (status);`)
	return err
}

const eventCols = "id,org_unit,name,category,seat_cap,event_date,registrations,next_seq,status,created_on,updated_at"

func scanEvent(row interface{ Scan(...any) error }) (ActivityEvent, error) {
	var e ActivityEvent
	var regs string
	err := row.Scan(&e.ID, &e.OrgUnit, &e.Name, &e.Category, &e.SeatCap, &e.EventDate, &regs, &e.NextSeq, &e.Status, &e.CreatedOn, &e.UpdatedAt)
	if err != nil {
		return ActivityEvent{}, err
	}
	if regs != "" && regs != "[]" {
		_ = json.Unmarshal([]byte(regs), &e.Registrations)
	}
	return e, nil
}

func (s *pgEventStore) Upsert(e ActivityEvent) (ActivityEvent, error) {
	regs, err := json.Marshal(e.Registrations)
	if err != nil {
		return ActivityEvent{}, err
	}
	if len(e.Registrations) == 0 {
		regs = []byte("[]")
	}
	if _, err := s.db.Exec(`INSERT INTO activity_events (`+eventCols+`)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        ON CONFLICT (id) DO UPDATE SET org_unit=$2,name=$3,category=$4,seat_cap=$5,event_date=$6,registrations=$7,
            next_seq=$8,status=$9,created_on=$10,updated_at=$11`,
		e.ID, e.OrgUnit, e.Name, e.Category, e.SeatCap, e.EventDate, string(regs), e.NextSeq, e.Status, e.CreatedOn, e.UpdatedAt); err != nil {
		return ActivityEvent{}, err
	}
	return e, nil
}

func (s *pgEventStore) Get(id string) (ActivityEvent, bool) {
	e, err := scanEvent(s.db.QueryRow(`SELECT `+eventCols+` FROM activity_events WHERE id=$1`, id))
	if err != nil {
		return ActivityEvent{}, false
	}
	return e, true
}

func (s *pgEventStore) List(f eventFilter) []ActivityEvent {
	rows, err := s.db.Query(`SELECT ` + eventCols + ` FROM activity_events`)
	if err != nil {
		return nil
	}
	defer rows.Close()
	var out []ActivityEvent
	for rows.Next() {
		e, err := scanEvent(rows)
		if err != nil {
			continue
		}
		if matchEvent(f, e) {
			out = append(out, e)
		}
	}
	return out
}
