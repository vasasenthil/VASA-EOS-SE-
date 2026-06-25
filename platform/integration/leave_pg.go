package integration

import (
	"database/sql"
	"encoding/json"
	"errors"
	"time"

	"github.com/vasa-eos-se-tn/platform/leave"
)

// pgLeaveStore is the durable PostgreSQL adapter for staff leave requests (approval chain stored as JSONB). It
// applies the SAME pure transitions (leave.NewRequest / leave.ApplyDecide) as the in-memory store.
type pgLeaveStore struct{ db *sql.DB }

func newPgLeaveStore(dsn string) (*pgLeaveStore, error) {
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, err
	}
	if err := db.Ping(); err != nil {
		return nil, err
	}
	s := &pgLeaveStore{db: db}
	if err := s.ensureSchema(); err != nil {
		return nil, err
	}
	return s, nil
}

func (s *pgLeaveStore) ensureSchema() error {
	_, err := s.db.Exec(`
CREATE TABLE IF NOT EXISTS leave_requests (
    id           TEXT PRIMARY KEY,
    employee     TEXT NOT NULL,
    type         TEXT NOT NULL,
    from_date    TEXT NOT NULL,
    to_date      TEXT NOT NULL,
    days         INT  NOT NULL,
    reason       TEXT NOT NULL DEFAULT '',
    org_unit     TEXT NOT NULL,
    status       TEXT NOT NULL DEFAULT 'pending',
    chain        JSONB NOT NULL DEFAULT '[]'::jsonb,
    current_step INT  NOT NULL DEFAULT 0,
    created_at   TEXT NOT NULL,
    updated_at   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS leave_requests_org_idx    ON leave_requests (org_unit);
CREATE INDEX IF NOT EXISTS leave_requests_status_idx ON leave_requests (status);`)
	return err
}

const leaveCols = "id,employee,type,from_date,to_date,days,reason,org_unit,status,chain,current_step,created_at,updated_at"

func scanLeave(row interface{ Scan(...any) error }) (leave.Request, error) {
	var r leave.Request
	var chainJSON []byte
	if err := row.Scan(&r.ID, &r.Employee, &r.Type, &r.From, &r.To, &r.Days, &r.Reason, &r.OrgUnit,
		&r.Status, &chainJSON, &r.CurrentStep, &r.CreatedAt, &r.UpdatedAt); err != nil {
		return leave.Request{}, err
	}
	if len(chainJSON) > 0 {
		_ = json.Unmarshal(chainJSON, &r.Chain)
	}
	return r, nil
}

func (s *pgLeaveStore) Get(id string) (leave.Request, bool) {
	r, err := scanLeave(s.db.QueryRow(`SELECT `+leaveCols+` FROM leave_requests WHERE id=$1`, id))
	if err != nil {
		return leave.Request{}, false
	}
	return r, true
}

func (s *pgLeaveStore) insert(r leave.Request) error {
	chainJSON, _ := json.Marshal(r.Chain)
	if len(chainJSON) == 0 {
		chainJSON = []byte("[]")
	}
	_, err := s.db.Exec(`INSERT INTO leave_requests (`+leaveCols+`)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
		r.ID, r.Employee, r.Type, r.From, r.To, r.Days, r.Reason, r.OrgUnit, r.Status, chainJSON,
		r.CurrentStep, r.CreatedAt, r.UpdatedAt)
	return err
}

func (s *pgLeaveStore) File(id, employee, ltype, from, to, reason, orgUnit string) (leave.Request, error) {
	r, err := leave.NewRequest(id, employee, ltype, from, to, reason, orgUnit, time.Now().UTC().Format(time.RFC3339))
	if err != nil {
		return leave.Request{}, err
	}
	if err := s.insert(r); err != nil {
		return leave.Request{}, err // unique-violation on duplicate id
	}
	return r, nil
}

func (s *pgLeaveStore) Decide(id string, approve bool, actorRole, actorID, note string) (leave.Request, error) {
	r, ok := s.Get(id)
	if !ok {
		return leave.Request{}, errors.New("leave: not found")
	}
	out, err := leave.ApplyDecide(r, approve, actorRole, actorID, note, time.Now().UTC().Format(time.RFC3339))
	if err != nil {
		return leave.Request{}, err
	}
	chainJSON, _ := json.Marshal(out.Chain)
	if _, err := s.db.Exec(`UPDATE leave_requests SET status=$2,chain=$3,current_step=$4,updated_at=$5 WHERE id=$1`,
		out.ID, out.Status, chainJSON, out.CurrentStep, out.UpdatedAt); err != nil {
		return leave.Request{}, err
	}
	return out, nil
}

func (s *pgLeaveStore) List(f leave.Filter) []leave.Request {
	rows, err := s.db.Query(`SELECT ` + leaveCols + ` FROM leave_requests ORDER BY created_at DESC, id`)
	if err != nil {
		return nil
	}
	defer rows.Close()
	var out []leave.Request
	for rows.Next() {
		r, err := scanLeave(rows)
		if err != nil {
			continue
		}
		if leave.Match(f, r) {
			out = append(out, r)
		}
	}
	return out
}
