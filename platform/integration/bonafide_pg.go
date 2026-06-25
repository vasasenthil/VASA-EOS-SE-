package integration

import "database/sql"

// pgBonafideStore is the durable PostgreSQL adapter for the bonafide certificate register.
type pgBonafideStore struct{ db *sql.DB }

func newPgBonafideStore(dsn string) (*pgBonafideStore, error) {
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, err
	}
	if err := db.Ping(); err != nil {
		return nil, err
	}
	s := &pgBonafideStore{db: db}
	if err := s.ensureSchema(); err != nil {
		return nil, err
	}
	return s, nil
}

func (s *pgBonafideStore) ensureSchema() error {
	_, err := s.db.Exec(`
CREATE TABLE IF NOT EXISTS bonafide_certificates (
    id           TEXT PRIMARY KEY,
    org_unit     TEXT NOT NULL,
    student_id   TEXT NOT NULL,
    student_name TEXT NOT NULL DEFAULT '',
    purpose      TEXT NOT NULL,
    serial       TEXT NOT NULL DEFAULT '',
    status       TEXT NOT NULL,
    requested_on TEXT NOT NULL DEFAULT '',
    issued_on    TEXT NOT NULL DEFAULT '',
    updated_at   TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS bonafide_org_idx     ON bonafide_certificates (org_unit);
CREATE INDEX IF NOT EXISTS bonafide_student_idx ON bonafide_certificates (student_id);
CREATE INDEX IF NOT EXISTS bonafide_status_idx  ON bonafide_certificates (status);`)
	return err
}

const bonafideCols = "id,org_unit,student_id,student_name,purpose,serial,status,requested_on,issued_on,updated_at"

func scanBonafide(row interface{ Scan(...any) error }) (BonafideCertificate, error) {
	var b BonafideCertificate
	err := row.Scan(&b.ID, &b.OrgUnit, &b.StudentID, &b.StudentName, &b.Purpose, &b.Serial, &b.Status,
		&b.RequestedOn, &b.IssuedOn, &b.UpdatedAt)
	if err != nil {
		return BonafideCertificate{}, err
	}
	return b, nil
}

func (s *pgBonafideStore) Upsert(b BonafideCertificate) (BonafideCertificate, error) {
	if _, err := s.db.Exec(`INSERT INTO bonafide_certificates (`+bonafideCols+`)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        ON CONFLICT (id) DO UPDATE SET org_unit=$2,student_id=$3,student_name=$4,purpose=$5,serial=$6,
            status=$7,requested_on=$8,issued_on=$9,updated_at=$10`,
		b.ID, b.OrgUnit, b.StudentID, b.StudentName, b.Purpose, b.Serial, b.Status, b.RequestedOn, b.IssuedOn, b.UpdatedAt); err != nil {
		return BonafideCertificate{}, err
	}
	return b, nil
}

func (s *pgBonafideStore) Get(id string) (BonafideCertificate, bool) {
	b, err := scanBonafide(s.db.QueryRow(`SELECT `+bonafideCols+` FROM bonafide_certificates WHERE id=$1`, id))
	if err != nil {
		return BonafideCertificate{}, false
	}
	return b, true
}

func (s *pgBonafideStore) List(f bonafideFilter) []BonafideCertificate {
	rows, err := s.db.Query(`SELECT ` + bonafideCols + ` FROM bonafide_certificates`)
	if err != nil {
		return nil
	}
	defer rows.Close()
	var out []BonafideCertificate
	for rows.Next() {
		b, err := scanBonafide(rows)
		if err != nil {
			continue
		}
		if matchBonafide(f, b) {
			out = append(out, b)
		}
	}
	return out
}
