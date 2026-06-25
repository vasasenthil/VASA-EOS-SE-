package integration

import (
	"database/sql"
	"encoding/json"
)

// pgSMCStore is the durable PostgreSQL adapter for SMC (School Management Committee) meetings & resolutions.
type pgSMCStore struct{ db *sql.DB }

func newPgSMCStore(dsn string) (*pgSMCStore, error) {
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, err
	}
	if err := db.Ping(); err != nil {
		return nil, err
	}
	s := &pgSMCStore{db: db}
	if err := s.ensureSchema(); err != nil {
		return nil, err
	}
	return s, nil
}

func (s *pgSMCStore) ensureSchema() error {
	_, err := s.db.Exec(`
CREATE TABLE IF NOT EXISTS smc_meetings (
    id             TEXT PRIMARY KEY,
    org_unit       TEXT NOT NULL,
    title          TEXT NOT NULL,
    scheduled_date TEXT NOT NULL,
    total_members  INTEGER NOT NULL,
    parent_members INTEGER NOT NULL,
    present_count  INTEGER NOT NULL DEFAULT 0,
    status         TEXT NOT NULL,
    resolutions    TEXT NOT NULL DEFAULT '[]',
    created_on     TEXT NOT NULL DEFAULT '',
    updated_at     TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS smc_org_idx    ON smc_meetings (org_unit);
CREATE INDEX IF NOT EXISTS smc_status_idx ON smc_meetings (status);`)
	return err
}

const smcCols = "id,org_unit,title,scheduled_date,total_members,parent_members,present_count,status,resolutions,created_on,updated_at"

func scanSMC(row interface{ Scan(...any) error }) (SMCMeeting, error) {
	var m SMCMeeting
	var resolutions string
	err := row.Scan(&m.ID, &m.OrgUnit, &m.Title, &m.ScheduledDate, &m.TotalMembers, &m.ParentMembers,
		&m.PresentCount, &m.Status, &resolutions, &m.CreatedOn, &m.UpdatedAt)
	if err != nil {
		return SMCMeeting{}, err
	}
	if resolutions != "" && resolutions != "[]" {
		_ = json.Unmarshal([]byte(resolutions), &m.Resolutions)
	}
	return m, nil
}

func (s *pgSMCStore) Upsert(m SMCMeeting) (SMCMeeting, error) {
	resolutions, err := json.Marshal(m.Resolutions)
	if err != nil {
		return SMCMeeting{}, err
	}
	if len(m.Resolutions) == 0 {
		resolutions = []byte("[]")
	}
	if _, err := s.db.Exec(`INSERT INTO smc_meetings (`+smcCols+`)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        ON CONFLICT (id) DO UPDATE SET org_unit=$2,title=$3,scheduled_date=$4,total_members=$5,parent_members=$6,
            present_count=$7,status=$8,resolutions=$9,created_on=$10,updated_at=$11`,
		m.ID, m.OrgUnit, m.Title, m.ScheduledDate, m.TotalMembers, m.ParentMembers, m.PresentCount, m.Status,
		string(resolutions), m.CreatedOn, m.UpdatedAt); err != nil {
		return SMCMeeting{}, err
	}
	return m, nil
}

func (s *pgSMCStore) Get(id string) (SMCMeeting, bool) {
	m, err := scanSMC(s.db.QueryRow(`SELECT `+smcCols+` FROM smc_meetings WHERE id=$1`, id))
	if err != nil {
		return SMCMeeting{}, false
	}
	return m, true
}

func (s *pgSMCStore) List(f smcFilter) []SMCMeeting {
	rows, err := s.db.Query(`SELECT ` + smcCols + ` FROM smc_meetings`)
	if err != nil {
		return nil
	}
	defer rows.Close()
	var out []SMCMeeting
	for rows.Next() {
		m, err := scanSMC(rows)
		if err != nil {
			continue
		}
		if matchSMC(f, m) {
			out = append(out, m)
		}
	}
	return out
}
