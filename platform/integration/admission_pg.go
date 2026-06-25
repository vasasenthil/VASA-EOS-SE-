package integration

import "database/sql"

// pgAdmissionStore persists admission application records to PostgreSQL. PII is not stored here (only the
// decision, reasons, references and the pii_sealed flag), so the applications register is durable and
// queryable without exposing applicant identities.
type pgAdmissionStore struct{ db *sql.DB }

func newPgAdmissionStore(dsn string) (*pgAdmissionStore, error) {
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, err
	}
	if err := db.Ping(); err != nil {
		return nil, err
	}
	s := &pgAdmissionStore{db: db}
	if err := s.ensureSchema(); err != nil {
		return nil, err
	}
	return s, nil
}

func (s *pgAdmissionStore) ensureSchema() error {
	_, err := s.db.Exec(`
CREATE TABLE IF NOT EXISTS admission_applications (
    id            TEXT PRIMARY KEY,
    category      TEXT NOT NULL DEFAULT '',
    age           INT  NOT NULL DEFAULT 0,
    tenant        TEXT NOT NULL DEFAULT '',
    region        TEXT NOT NULL DEFAULT '',
    decision      TEXT NOT NULL DEFAULT '',
    stage         TEXT NOT NULL DEFAULT '',
    effect        TEXT NOT NULL DEFAULT '',
    reasons       TEXT NOT NULL DEFAULT '',
    request_id    TEXT NOT NULL DEFAULT '',
    credential_id TEXT NOT NULL DEFAULT '',
    pii_sealed    BOOLEAN NOT NULL DEFAULT false,
    decided_at    TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS admission_applications_tenant_idx ON admission_applications (tenant);
CREATE INDEX IF NOT EXISTS admission_applications_stage_idx  ON admission_applications (stage);`)
	return err
}

const admCols = "id,category,age,tenant,region,decision,stage,effect,reasons,request_id,credential_id,pii_sealed,decided_at"

func scanAdmission(row interface{ Scan(...any) error }) (AdmissionApplication, error) {
	var a AdmissionApplication
	err := row.Scan(&a.ID, &a.Category, &a.Age, &a.Tenant, &a.Region, &a.Decision, &a.Stage, &a.Effect,
		&a.Reasons, &a.RequestID, &a.CredentialID, &a.PIISealed, &a.DecidedAt)
	return a, err
}

// Record upserts an application (the same applicant id may be re-decided, e.g. after a HITL finalisation).
func (s *pgAdmissionStore) Record(a AdmissionApplication) error {
	_, err := s.db.Exec(`INSERT INTO admission_applications (`+admCols+`)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
        ON CONFLICT (id) DO UPDATE SET category=$2,age=$3,tenant=$4,region=$5,decision=$6,stage=$7,
            effect=$8,reasons=$9,request_id=$10,credential_id=$11,pii_sealed=$12,decided_at=$13`,
		a.ID, a.Category, a.Age, a.Tenant, a.Region, a.Decision, a.Stage, a.Effect, a.Reasons,
		a.RequestID, a.CredentialID, a.PIISealed, a.DecidedAt)
	return err
}

func (s *pgAdmissionStore) Get(id string) (AdmissionApplication, bool) {
	a, err := scanAdmission(s.db.QueryRow(`SELECT `+admCols+` FROM admission_applications WHERE id=$1`, id))
	if err != nil {
		return AdmissionApplication{}, false
	}
	return a, true
}

func (s *pgAdmissionStore) List() []AdmissionApplication {
	rows, err := s.db.Query(`SELECT ` + admCols + ` FROM admission_applications ORDER BY id`)
	if err != nil {
		return nil
	}
	defer rows.Close()
	var out []AdmissionApplication
	for rows.Next() {
		a, err := scanAdmission(rows)
		if err != nil {
			continue
		}
		out = append(out, a)
	}
	return out
}
