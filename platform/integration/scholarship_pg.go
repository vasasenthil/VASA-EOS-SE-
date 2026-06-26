package integration

import (
	"database/sql"
	"encoding/json"
	"errors"
	"time"

	"github.com/vasa-eos-se-tn/platform/scholarship"
)

// pgSchoStore is the durable PostgreSQL adapter for scholarship/DBT disbursements (approval chain as JSONB,
// money in paise). Applies the SAME pure transitions as the in-memory store.
type pgSchoStore struct{ db *sql.DB }

func newPgSchoStore(dsn string) (*pgSchoStore, error) {
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, err
	}
	if err := db.Ping(); err != nil {
		return nil, err
	}
	s := &pgSchoStore{db: db}
	if err := s.ensureSchema(); err != nil {
		return nil, err
	}
	return s, nil
}

func (s *pgSchoStore) ensureSchema() error {
	_, err := s.db.Exec(`
CREATE TABLE IF NOT EXISTS scholarship_disbursements (
    id           TEXT PRIMARY KEY,
    student_id   TEXT NOT NULL,
    scheme       TEXT NOT NULL,
    amount_paise BIGINT NOT NULL,
    org_unit     TEXT NOT NULL,
    status       TEXT NOT NULL DEFAULT 'pending',
    chain        JSONB NOT NULL DEFAULT '[]'::jsonb,
    current_step INT  NOT NULL DEFAULT 0,
    payment_ref  TEXT NOT NULL DEFAULT '',
    filed_at     TEXT NOT NULL,
    updated_at   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS scholarship_org_idx     ON scholarship_disbursements (org_unit);
CREATE INDEX IF NOT EXISTS scholarship_status_idx  ON scholarship_disbursements (status);`)
	return err
}

const schoCols = "id,student_id,scheme,amount_paise,org_unit,status,chain,current_step,payment_ref,filed_at,updated_at"

func scanScho(row interface{ Scan(...any) error }) (scholarship.Disbursement, error) {
	var d scholarship.Disbursement
	var chainJSON []byte
	if err := row.Scan(&d.ID, &d.StudentID, &d.Scheme, &d.AmountPaise, &d.OrgUnit, &d.Status, &chainJSON,
		&d.CurrentStep, &d.PaymentRef, &d.FiledAt, &d.UpdatedAt); err != nil {
		return scholarship.Disbursement{}, err
	}
	if len(chainJSON) > 0 {
		_ = json.Unmarshal(chainJSON, &d.Chain)
	}
	return d, nil
}

func (s *pgSchoStore) Get(id string) (scholarship.Disbursement, bool) {
	d, err := scanScho(s.db.QueryRow(`SELECT `+schoCols+` FROM scholarship_disbursements WHERE id=$1`, id))
	if err != nil {
		return scholarship.Disbursement{}, false
	}
	return d, true
}

func (s *pgSchoStore) File(id, studentID, scheme string, amountPaise int64, orgUnit string) (scholarship.Disbursement, error) {
	d, err := scholarship.NewDisbursement(id, studentID, scheme, amountPaise, orgUnit, time.Now().UTC().Format(time.RFC3339))
	if err != nil {
		return scholarship.Disbursement{}, err
	}
	chainJSON, _ := json.Marshal(d.Chain)
	if _, err := s.db.Exec(`INSERT INTO scholarship_disbursements (`+schoCols+`)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
		d.ID, d.StudentID, d.Scheme, d.AmountPaise, d.OrgUnit, d.Status, chainJSON, d.CurrentStep,
		d.PaymentRef, d.FiledAt, d.UpdatedAt); err != nil {
		return scholarship.Disbursement{}, err // duplicate id
	}
	return d, nil
}

func (s *pgSchoStore) persist(d scholarship.Disbursement) error {
	chainJSON, _ := json.Marshal(d.Chain)
	_, err := s.db.Exec(`UPDATE scholarship_disbursements SET status=$2,chain=$3,current_step=$4,payment_ref=$5,updated_at=$6 WHERE id=$1`,
		d.ID, d.Status, chainJSON, d.CurrentStep, d.PaymentRef, d.UpdatedAt)
	return err
}

func (s *pgSchoStore) apply(id string, fn func(scholarship.Disbursement, string) (scholarship.Disbursement, error)) (scholarship.Disbursement, error) {
	d, ok := s.Get(id)
	if !ok {
		return scholarship.Disbursement{}, errors.New("scholarship: not found")
	}
	out, err := fn(d, time.Now().UTC().Format(time.RFC3339))
	if err != nil {
		return scholarship.Disbursement{}, err
	}
	if err := s.persist(out); err != nil {
		return scholarship.Disbursement{}, err
	}
	return out, nil
}

func (s *pgSchoStore) Decide(id string, approve bool, actorRole, actorID, note string) (scholarship.Disbursement, error) {
	return s.apply(id, func(d scholarship.Disbursement, now string) (scholarship.Disbursement, error) {
		return scholarship.ApplyDecide(d, approve, actorRole, actorID, note, now)
	})
}

func (s *pgSchoStore) Disburse(id, paymentRef string) (scholarship.Disbursement, error) {
	return s.apply(id, func(d scholarship.Disbursement, now string) (scholarship.Disbursement, error) {
		return scholarship.ApplyDisburse(d, paymentRef, now)
	})
}

func (s *pgSchoStore) Reconcile(id string, matched bool) (scholarship.Disbursement, error) {
	return s.apply(id, func(d scholarship.Disbursement, now string) (scholarship.Disbursement, error) {
		return scholarship.ApplyReconcile(d, matched, now)
	})
}

func (s *pgSchoStore) List(f scholarship.Filter) []scholarship.Disbursement {
	rows, err := s.db.Query(`SELECT ` + schoCols + ` FROM scholarship_disbursements ORDER BY filed_at DESC, id`)
	if err != nil {
		return nil
	}
	defer rows.Close()
	var out []scholarship.Disbursement
	for rows.Next() {
		d, err := scanScho(rows)
		if err != nil {
			continue
		}
		if scholarship.Match(f, d) {
			out = append(out, d)
		}
	}
	return out
}
