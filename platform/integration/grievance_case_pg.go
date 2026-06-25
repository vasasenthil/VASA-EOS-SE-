package integration

import (
	"database/sql"
	"encoding/json"
	"errors"
	"time"

	"github.com/vasa-eos-se-tn/platform/grievance"
)

// pgGrievStore is the durable PostgreSQL adapter for grievance cases (escalation chain as JSONB). It applies
// the SAME pure transitions (grievance.NewGrievance / ApplyResolve / ApplyReject / ApplyEscalate) as the
// in-memory store, loading + saving around each.
type pgGrievStore struct{ db *sql.DB }

func newPgGrievStore(dsn string) (*pgGrievStore, error) {
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, err
	}
	if err := db.Ping(); err != nil {
		return nil, err
	}
	s := &pgGrievStore{db: db}
	if err := s.ensureSchema(); err != nil {
		return nil, err
	}
	return s, nil
}

func (s *pgGrievStore) ensureSchema() error {
	_, err := s.db.Exec(`
CREATE TABLE IF NOT EXISTS grievance_cases (
    id           TEXT PRIMARY KEY,
    complainant  TEXT NOT NULL,
    category     TEXT NOT NULL,
    subject      TEXT NOT NULL DEFAULT '',
    org_unit     TEXT NOT NULL,
    status       TEXT NOT NULL DEFAULT 'open',
    chain        JSONB NOT NULL DEFAULT '[]'::jsonb,
    current_tier INT  NOT NULL DEFAULT 0,
    filed_at     TEXT NOT NULL,
    due_at       TEXT NOT NULL,
    resolution   TEXT NOT NULL DEFAULT '',
    updated_at   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS grievance_cases_org_idx    ON grievance_cases (org_unit);
CREATE INDEX IF NOT EXISTS grievance_cases_status_idx ON grievance_cases (status);`)
	return err
}

const grievCols = "id,complainant,category,subject,org_unit,status,chain,current_tier,filed_at,due_at,resolution,updated_at"

func scanGriev(row interface{ Scan(...any) error }) (grievance.Grievance, error) {
	var g grievance.Grievance
	var chainJSON []byte
	if err := row.Scan(&g.ID, &g.Complainant, &g.Category, &g.Subject, &g.OrgUnit, &g.Status, &chainJSON,
		&g.CurrentTier, &g.FiledAt, &g.DueAt, &g.Resolution, &g.UpdatedAt); err != nil {
		return grievance.Grievance{}, err
	}
	if len(chainJSON) > 0 {
		_ = json.Unmarshal(chainJSON, &g.Chain)
	}
	return g, nil
}

func (s *pgGrievStore) Get(id string) (grievance.Grievance, bool) {
	g, err := scanGriev(s.db.QueryRow(`SELECT `+grievCols+` FROM grievance_cases WHERE id=$1`, id))
	if err != nil {
		return grievance.Grievance{}, false
	}
	return g, true
}

func (s *pgGrievStore) File(id, complainant, category, subject, orgUnit string) (grievance.Grievance, error) {
	g, err := grievance.NewGrievance(id, complainant, category, subject, orgUnit, time.Now().UTC().Format(time.RFC3339))
	if err != nil {
		return grievance.Grievance{}, err
	}
	chainJSON, _ := json.Marshal(g.Chain)
	if _, err := s.db.Exec(`INSERT INTO grievance_cases (`+grievCols+`)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
		g.ID, g.Complainant, g.Category, g.Subject, g.OrgUnit, g.Status, chainJSON, g.CurrentTier,
		g.FiledAt, g.DueAt, g.Resolution, g.UpdatedAt); err != nil {
		return grievance.Grievance{}, err // duplicate id
	}
	return g, nil
}

// persist writes the mutable columns after a transition.
func (s *pgGrievStore) persist(g grievance.Grievance) error {
	chainJSON, _ := json.Marshal(g.Chain)
	_, err := s.db.Exec(`UPDATE grievance_cases SET status=$2,chain=$3,current_tier=$4,due_at=$5,resolution=$6,updated_at=$7 WHERE id=$1`,
		g.ID, g.Status, chainJSON, g.CurrentTier, g.DueAt, g.Resolution, g.UpdatedAt)
	return err
}

func (s *pgGrievStore) apply(id string, fn func(grievance.Grievance, string) (grievance.Grievance, error)) (grievance.Grievance, error) {
	g, ok := s.Get(id)
	if !ok {
		return grievance.Grievance{}, errors.New("grievance: not found")
	}
	out, err := fn(g, time.Now().UTC().Format(time.RFC3339))
	if err != nil {
		return grievance.Grievance{}, err
	}
	if err := s.persist(out); err != nil {
		return grievance.Grievance{}, err
	}
	return out, nil
}

func (s *pgGrievStore) Resolve(id, actorRole, actorID, resolution string) (grievance.Grievance, error) {
	return s.apply(id, func(g grievance.Grievance, now string) (grievance.Grievance, error) {
		return grievance.ApplyResolve(g, actorRole, actorID, resolution, now)
	})
}

func (s *pgGrievStore) Reject(id, actorRole, actorID, note string) (grievance.Grievance, error) {
	return s.apply(id, func(g grievance.Grievance, now string) (grievance.Grievance, error) {
		return grievance.ApplyReject(g, actorRole, actorID, note, now)
	})
}

func (s *pgGrievStore) Escalate(id, by, reason string) (grievance.Grievance, error) {
	return s.apply(id, func(g grievance.Grievance, now string) (grievance.Grievance, error) {
		return grievance.ApplyEscalate(g, by, reason, now)
	})
}

func (s *pgGrievStore) List(f grievance.Filter) []grievance.Grievance {
	rows, err := s.db.Query(`SELECT ` + grievCols + ` FROM grievance_cases ORDER BY filed_at DESC, id`)
	if err != nil {
		return nil
	}
	defer rows.Close()
	var out []grievance.Grievance
	for rows.Next() {
		g, err := scanGriev(rows)
		if err != nil {
			continue
		}
		if grievance.Match(f, g) {
			out = append(out, g)
		}
	}
	return out
}
