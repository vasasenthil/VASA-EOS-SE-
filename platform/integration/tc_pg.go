package integration

import "database/sql"

// pgTCStore is the durable PostgreSQL adapter for the Transfer Certificate register.
type pgTCStore struct{ db *sql.DB }

func newPgTCStore(dsn string) (*pgTCStore, error) {
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, err
	}
	if err := db.Ping(); err != nil {
		return nil, err
	}
	s := &pgTCStore{db: db}
	if err := s.ensureSchema(); err != nil {
		return nil, err
	}
	return s, nil
}

func (s *pgTCStore) ensureSchema() error {
	_, err := s.db.Exec(`
CREATE TABLE IF NOT EXISTS transfer_certificates (
    id           TEXT PRIMARY KEY,
    org_unit     TEXT NOT NULL,
    student_id   TEXT NOT NULL,
    reason       TEXT NOT NULL,
    status       TEXT NOT NULL,
    serial       TEXT NOT NULL DEFAULT '',
    issued_on    TEXT NOT NULL DEFAULT '',
    requested_on TEXT NOT NULL,
    note         TEXT NOT NULL DEFAULT '',
    updated_at   TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS tc_org_idx     ON transfer_certificates (org_unit);
CREATE INDEX IF NOT EXISTS tc_student_idx ON transfer_certificates (student_id);
CREATE INDEX IF NOT EXISTS tc_status_idx  ON transfer_certificates (status);`)
	return err
}

const tcCols = "id,org_unit,student_id,reason,status,serial,issued_on,requested_on,note,updated_at"

func scanTC(row interface{ Scan(...any) error }) (TransferCertificate, error) {
	var t TransferCertificate
	err := row.Scan(&t.ID, &t.OrgUnit, &t.StudentID, &t.Reason, &t.Status, &t.Serial,
		&t.IssuedOn, &t.RequestedOn, &t.Note, &t.UpdatedAt)
	return t, err
}

func (s *pgTCStore) Upsert(t TransferCertificate) (TransferCertificate, error) {
	if _, err := s.db.Exec(`INSERT INTO transfer_certificates (`+tcCols+`)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        ON CONFLICT (id) DO UPDATE SET org_unit=$2,student_id=$3,reason=$4,status=$5,serial=$6,
            issued_on=$7,requested_on=$8,note=$9,updated_at=$10`,
		t.ID, t.OrgUnit, t.StudentID, t.Reason, t.Status, t.Serial, t.IssuedOn, t.RequestedOn, t.Note, t.UpdatedAt); err != nil {
		return TransferCertificate{}, err
	}
	return t, nil
}

func (s *pgTCStore) Get(id string) (TransferCertificate, bool) {
	t, err := scanTC(s.db.QueryRow(`SELECT `+tcCols+` FROM transfer_certificates WHERE id=$1`, id))
	if err != nil {
		return TransferCertificate{}, false
	}
	return t, true
}

func (s *pgTCStore) List(f tcFilter) []TransferCertificate {
	rows, err := s.db.Query(`SELECT ` + tcCols + ` FROM transfer_certificates`)
	if err != nil {
		return nil
	}
	defer rows.Close()
	var out []TransferCertificate
	for rows.Next() {
		t, err := scanTC(rows)
		if err != nil {
			continue
		}
		if matchTC(f, t) {
			out = append(out, t)
		}
	}
	return out
}
