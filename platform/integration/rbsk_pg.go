package integration

import (
	"database/sql"
	"encoding/json"
	"errors"

	"github.com/vasa-eos-se-tn/platform/rbsk"
)

// pgRbskStore is the durable PostgreSQL adapter for RBSK screenings (findings as JSONB).
type pgRbskStore struct{ db *sql.DB }

func newPgRbskStore(dsn string) (*pgRbskStore, error) {
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, err
	}
	if err := db.Ping(); err != nil {
		return nil, err
	}
	s := &pgRbskStore{db: db}
	if err := s.ensureSchema(); err != nil {
		return nil, err
	}
	return s, nil
}

func (s *pgRbskStore) ensureSchema() error {
	_, err := s.db.Exec(`
CREATE TABLE IF NOT EXISTS rbsk_screenings (
    id             TEXT PRIMARY KEY,
    student_id     TEXT NOT NULL,
    org_unit       TEXT NOT NULL,
    screened_on    TEXT NOT NULL,
    findings       JSONB NOT NULL DEFAULT '[]'::jsonb,
    status         TEXT NOT NULL,
    referred_to    TEXT NOT NULL DEFAULT '',
    closed_outcome TEXT NOT NULL DEFAULT '',
    updated_at     TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS rbsk_org_idx    ON rbsk_screenings (org_unit);
CREATE INDEX IF NOT EXISTS rbsk_status_idx ON rbsk_screenings (status);`)
	return err
}

const rbskCols = "id,student_id,org_unit,screened_on,findings,status,referred_to,closed_outcome,updated_at"

func scanRbsk(row interface{ Scan(...any) error }) (rbsk.Screening, error) {
	var sc rbsk.Screening
	var findingsJSON []byte
	if err := row.Scan(&sc.ID, &sc.StudentID, &sc.OrgUnit, &sc.ScreenedOn, &findingsJSON, &sc.Status, &sc.ReferredTo, &sc.ClosedOutcome, &sc.UpdatedAt); err != nil {
		return rbsk.Screening{}, err
	}
	if len(findingsJSON) > 0 {
		_ = json.Unmarshal(findingsJSON, &sc.Findings)
	}
	return sc, nil
}

func (s *pgRbskStore) Get(id string) (rbsk.Screening, bool) {
	sc, err := scanRbsk(s.db.QueryRow(`SELECT `+rbskCols+` FROM rbsk_screenings WHERE id=$1`, id))
	if err != nil {
		return rbsk.Screening{}, false
	}
	return sc, true
}

func (s *pgRbskStore) File(id, studentID, orgUnit, screenedOn string, findings []string) (rbsk.Screening, error) {
	sc, err := rbsk.NewScreening(id, studentID, orgUnit, screenedOn, findings, now3339())
	if err != nil {
		return rbsk.Screening{}, err
	}
	fj, _ := json.Marshal(sc.Findings)
	if len(fj) == 0 {
		fj = []byte("[]")
	}
	if _, err := s.db.Exec(`INSERT INTO rbsk_screenings (`+rbskCols+`)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
		sc.ID, sc.StudentID, sc.OrgUnit, sc.ScreenedOn, fj, sc.Status, sc.ReferredTo, sc.ClosedOutcome, sc.UpdatedAt); err != nil {
		return rbsk.Screening{}, err
	}
	return sc, nil
}

func (s *pgRbskStore) persist(sc rbsk.Screening) error {
	_, err := s.db.Exec(`UPDATE rbsk_screenings SET status=$2,referred_to=$3,closed_outcome=$4,updated_at=$5 WHERE id=$1`,
		sc.ID, sc.Status, sc.ReferredTo, sc.ClosedOutcome, sc.UpdatedAt)
	return err
}

func (s *pgRbskStore) apply(id string, fn func(rbsk.Screening, string) (rbsk.Screening, error)) (rbsk.Screening, error) {
	sc, ok := s.Get(id)
	if !ok {
		return rbsk.Screening{}, errors.New("rbsk: not found")
	}
	out, err := fn(sc, now3339())
	if err != nil {
		return rbsk.Screening{}, err
	}
	if err := s.persist(out); err != nil {
		return rbsk.Screening{}, err
	}
	return out, nil
}

func (s *pgRbskStore) Treat(id string) (rbsk.Screening, error) {
	return s.apply(id, func(sc rbsk.Screening, now string) (rbsk.Screening, error) { return rbsk.ApplyTreat(sc, now) })
}

func (s *pgRbskStore) Close(id, outcome string) (rbsk.Screening, error) {
	return s.apply(id, func(sc rbsk.Screening, now string) (rbsk.Screening, error) { return rbsk.ApplyClose(sc, outcome, now) })
}

func (s *pgRbskStore) List(f rbsk.Filter) []rbsk.Screening {
	rows, err := s.db.Query(`SELECT ` + rbskCols + ` FROM rbsk_screenings ORDER BY screened_on DESC, id`)
	if err != nil {
		return nil
	}
	defer rows.Close()
	var out []rbsk.Screening
	for rows.Next() {
		sc, err := scanRbsk(rows)
		if err != nil {
			continue
		}
		if rbsk.Match(f, sc) {
			out = append(out, sc)
		}
	}
	return out
}
