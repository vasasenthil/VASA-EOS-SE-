package integration

import (
	"database/sql"
	"encoding/json"
	"errors"
	"time"

	"github.com/vasa-eos-se-tn/platform/calendar"

	_ "github.com/jackc/pgx/v5/stdlib" // real PostgreSQL driver (database/sql)
)

// calStore is the persistence port for the academic calendar. Two adapters satisfy it: the in-memory
// *calendar.Store (credential-free demo) and *pgCalendarStore (durable PostgreSQL). The composition root picks
// the Postgres adapter whenever DATABASE_URL is set — so a configured platform is NOT in-memory.
type calStore interface {
	Create(calendar.Entry) (calendar.Entry, error)
	Get(string) (calendar.Entry, bool)
	Update(id, title, etype, start, end, desc string) (calendar.Entry, error)
	Delete(string) bool
	List(calendar.Filter) []calendar.Entry
	Submit(string, []calendar.ApprovalStep) (calendar.Entry, error)
	Act(id string, approve bool, actorID, actorRole string, scopes []string, note string) (calendar.Entry, error)
}

// pgCalendarStore is the durable PostgreSQL adapter. It persists calendar entries (including the JSON approval
// chain) to a real table and applies the SAME pure domain transitions (calendar.Apply*) as the in-memory
// store, so behaviour is identical — only the storage is durable.
type pgCalendarStore struct{ db *sql.DB }

func now3339() string { return time.Now().UTC().Format(time.RFC3339) }

// newPgCalendarStore opens a connection pool, verifies it, and ensures the schema exists.
func newPgCalendarStore(dsn string) (*pgCalendarStore, error) {
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, err
	}
	db.SetMaxOpenConns(10)
	db.SetConnMaxLifetime(30 * time.Minute)
	if err := db.Ping(); err != nil {
		return nil, err
	}
	s := &pgCalendarStore{db: db}
	if err := s.ensureSchema(); err != nil {
		return nil, err
	}
	return s, nil
}

func (s *pgCalendarStore) ensureSchema() error {
	_, err := s.db.Exec(`
CREATE TABLE IF NOT EXISTS calendar_entries (
    id            TEXT PRIMARY KEY,
    title         TEXT NOT NULL,
    type          TEXT NOT NULL,
    start_date    TEXT NOT NULL,
    end_date      TEXT NOT NULL,
    org_unit      TEXT NOT NULL,
    academic_year TEXT NOT NULL DEFAULT '',
    description   TEXT NOT NULL DEFAULT '',
    status        TEXT NOT NULL DEFAULT 'draft',
    current_step  INT  NOT NULL DEFAULT 0,
    chain         JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at    TEXT NOT NULL,
    updated_at    TEXT NOT NULL,
    synthetic     BOOLEAN NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS calendar_entries_type_idx ON calendar_entries (type);
CREATE INDEX IF NOT EXISTS calendar_entries_org_idx  ON calendar_entries (org_unit);
CREATE INDEX IF NOT EXISTS calendar_entries_date_idx ON calendar_entries (start_date);`)
	return err
}

// scanEntry reads one row into an Entry (chain comes back as JSONB bytes).
func scanEntry(row interface{ Scan(...any) error }) (calendar.Entry, error) {
	var e calendar.Entry
	var chainJSON []byte
	if err := row.Scan(&e.ID, &e.Title, &e.Type, &e.StartDate, &e.EndDate, &e.OrgUnit, &e.AcademicYear,
		&e.Description, &e.Status, &e.CurrentStep, &chainJSON, &e.CreatedAt, &e.UpdatedAt, &e.Synthetic); err != nil {
		return calendar.Entry{}, err
	}
	if len(chainJSON) > 0 {
		_ = json.Unmarshal(chainJSON, &e.Chain)
	}
	return e, nil
}

const calCols = "id,title,type,start_date,end_date,org_unit,academic_year,description,status,current_step,chain,created_at,updated_at,synthetic"

func (s *pgCalendarStore) Get(id string) (calendar.Entry, bool) {
	row := s.db.QueryRow(`SELECT `+calCols+` FROM calendar_entries WHERE id=$1`, id)
	e, err := scanEntry(row)
	if err != nil {
		return calendar.Entry{}, false
	}
	return e, true
}

// insertRow writes a full entry row (used by Create).
func (s *pgCalendarStore) insertRow(e calendar.Entry) error {
	chainJSON, _ := json.Marshal(e.Chain)
	if len(chainJSON) == 0 {
		chainJSON = []byte("[]")
	}
	_, err := s.db.Exec(`INSERT INTO calendar_entries (`+calCols+`)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
		e.ID, e.Title, e.Type, e.StartDate, e.EndDate, e.OrgUnit, e.AcademicYear, e.Description,
		e.Status, e.CurrentStep, chainJSON, e.CreatedAt, e.UpdatedAt, e.Synthetic)
	return err
}

// persist writes the mutable columns (status/chain/step/fields/updated_at) after a transition.
func (s *pgCalendarStore) persist(e calendar.Entry) error {
	chainJSON, _ := json.Marshal(e.Chain)
	if len(chainJSON) == 0 {
		chainJSON = []byte("[]")
	}
	_, err := s.db.Exec(`UPDATE calendar_entries SET title=$2,type=$3,start_date=$4,end_date=$5,
        description=$6,status=$7,current_step=$8,chain=$9,updated_at=$10 WHERE id=$1`,
		e.ID, e.Title, e.Type, e.StartDate, e.EndDate, e.Description, e.Status, e.CurrentStep, chainJSON, e.UpdatedAt)
	return err
}

func (s *pgCalendarStore) Create(e calendar.Entry) (calendar.Entry, error) {
	if e.ID == "" {
		return calendar.Entry{}, errors.New("calendar: id is required")
	}
	if err := e.Validate(); err != nil {
		return calendar.Entry{}, err
	}
	if e.Status == "" {
		e.Status = calendar.Draft
	}
	e.CreatedAt, e.UpdatedAt = now3339(), now3339()
	if err := s.insertRow(e); err != nil {
		return calendar.Entry{}, err // includes unique-violation on duplicate id
	}
	return e, nil
}

func (s *pgCalendarStore) Update(id, title, etype, start, end, desc string) (calendar.Entry, error) {
	e, ok := s.Get(id)
	if !ok {
		return calendar.Entry{}, errors.New("calendar: not found")
	}
	out, err := calendar.ApplyUpdate(e, title, etype, start, end, desc, now3339())
	if err != nil {
		return calendar.Entry{}, err
	}
	if err := s.persist(out); err != nil {
		return calendar.Entry{}, err
	}
	return out, nil
}

func (s *pgCalendarStore) Delete(id string) bool {
	res, err := s.db.Exec(`DELETE FROM calendar_entries WHERE id=$1`, id)
	if err != nil {
		return false
	}
	n, _ := res.RowsAffected()
	return n > 0
}

func (s *pgCalendarStore) List(f calendar.Filter) []calendar.Entry {
	rows, err := s.db.Query(`SELECT ` + calCols + ` FROM calendar_entries ORDER BY start_date, id`)
	if err != nil {
		return nil
	}
	defer rows.Close()
	var out []calendar.Entry
	for rows.Next() {
		e, err := scanEntry(rows)
		if err != nil {
			continue
		}
		if calendar.FilterMatch(f, e) {
			out = append(out, e)
		}
	}
	return out
}

func (s *pgCalendarStore) Submit(id string, chain []calendar.ApprovalStep) (calendar.Entry, error) {
	e, ok := s.Get(id)
	if !ok {
		return calendar.Entry{}, errors.New("calendar: not found")
	}
	out, err := calendar.ApplySubmit(e, chain, now3339())
	if err != nil {
		return calendar.Entry{}, err
	}
	if err := s.persist(out); err != nil {
		return calendar.Entry{}, err
	}
	return out, nil
}

func (s *pgCalendarStore) Act(id string, approve bool, actorID, actorRole string, scopes []string, note string) (calendar.Entry, error) {
	e, ok := s.Get(id)
	if !ok {
		return calendar.Entry{}, errors.New("calendar: not found")
	}
	out, err := calendar.ApplyAct(e, approve, actorID, actorRole, scopes, note, now3339())
	if err != nil {
		return calendar.Entry{}, err
	}
	if err := s.persist(out); err != nil {
		return calendar.Entry{}, err
	}
	return out, nil
}
