package integration

import (
	"database/sql"
	"errors"
	"strconv"

	"github.com/vasa-eos-se-tn/platform/fees"
)

// pgFeesStore is the durable PostgreSQL adapter for the fee ledger (demands + payments). The no-overpayment
// invariant is enforced against the durable collected total inside the same transaction that writes the payment
// and recomputes the demand status, so the collection and the status update are atomic.
type pgFeesStore struct{ db *sql.DB }

func newPgFeesStore(dsn string) (*pgFeesStore, error) {
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, err
	}
	if err := db.Ping(); err != nil {
		return nil, err
	}
	s := &pgFeesStore{db: db}
	if err := s.ensureSchema(); err != nil {
		return nil, err
	}
	return s, nil
}

func (s *pgFeesStore) ensureSchema() error {
	_, err := s.db.Exec(`
CREATE TABLE IF NOT EXISTS fee_demands (
    id           TEXT PRIMARY KEY,
    org_unit     TEXT   NOT NULL,
    student_id   TEXT   NOT NULL,
    category     TEXT   NOT NULL,
    term         TEXT   NOT NULL DEFAULT '',
    amount_paise BIGINT NOT NULL,
    status       TEXT   NOT NULL,
    due_on       TEXT   NOT NULL
);
CREATE TABLE IF NOT EXISTS fee_payments (
    id           TEXT PRIMARY KEY,
    demand_id    TEXT   NOT NULL,
    org_unit     TEXT   NOT NULL,
    student_id   TEXT   NOT NULL,
    amount_paise BIGINT NOT NULL,
    mode         TEXT   NOT NULL,
    reference    TEXT   NOT NULL DEFAULT '',
    paid_on      TEXT   NOT NULL
);
CREATE INDEX IF NOT EXISTS fee_demands_org_idx     ON fee_demands (org_unit, status);
CREATE INDEX IF NOT EXISTS fee_payments_demand_idx ON fee_payments (demand_id);`)
	return err
}

const feeDemandCols = "id,org_unit,student_id,category,term,amount_paise,status,due_on"
const feePaymentCols = "id,demand_id,org_unit,student_id,amount_paise,mode,reference,paid_on"

func scanDemand(row interface{ Scan(...any) error }) (fees.Demand, error) {
	var d fees.Demand
	err := row.Scan(&d.ID, &d.OrgUnit, &d.StudentID, &d.Category, &d.Term, &d.AmountPaise, &d.Status, &d.DueOn)
	return d, err
}

func scanPayment(row interface{ Scan(...any) error }) (fees.Payment, error) {
	var p fees.Payment
	err := row.Scan(&p.ID, &p.DemandID, &p.OrgUnit, &p.StudentID, &p.AmountPaise, &p.Mode, &p.Reference, &p.PaidOn)
	return p, err
}

// RaiseDemand validates then upserts a fee demand by id.
func (s *pgFeesStore) RaiseDemand(d fees.Demand) (fees.Demand, error) {
	if d.Status == "" {
		d.Status = fees.Pending
	}
	if err := d.Validate(); err != nil {
		return fees.Demand{}, err
	}
	if _, err := s.db.Exec(`INSERT INTO fee_demands (`+feeDemandCols+`)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        ON CONFLICT (id) DO UPDATE SET org_unit=$2,student_id=$3,category=$4,term=$5,amount_paise=$6,status=$7,due_on=$8`,
		d.ID, d.OrgUnit, d.StudentID, d.Category, d.Term, d.AmountPaise, d.Status, d.DueOn); err != nil {
		return fees.Demand{}, err
	}
	return d, nil
}

func (s *pgFeesStore) GetDemand(id string) (fees.Demand, bool) {
	d, err := scanDemand(s.db.QueryRow(`SELECT `+feeDemandCols+` FROM fee_demands WHERE id=$1`, id))
	if err != nil {
		return fees.Demand{}, false
	}
	return d, true
}

// paidExcluding returns the collected total for a demand from a queryer, excluding one payment id.
func paidExcluding(q interface {
	QueryRow(string, ...any) *sql.Row
}, demandID, excludeID string) (int64, error) {
	var paid sql.NullInt64
	err := q.QueryRow(`SELECT COALESCE(SUM(amount_paise),0) FROM fee_payments WHERE demand_id=$1 AND id<>$2`, demandID, excludeID).Scan(&paid)
	if err != nil {
		return 0, err
	}
	return paid.Int64, nil
}

// RecordPayment enforces the no-overpayment invariant against the durable total and, in one transaction, writes
// the payment and recomputes the demand status.
func (s *pgFeesStore) RecordPayment(p fees.Payment) (fees.Payment, error) {
	if err := p.Validate(); err != nil {
		return fees.Payment{}, err
	}
	d, ok := s.GetDemand(p.DemandID)
	if !ok {
		return fees.Payment{}, errors.New("fees: unknown demand " + p.DemandID)
	}
	if !d.Open() {
		return fees.Payment{}, errors.New("fees: demand " + d.ID + " is " + d.Status + " and cannot take payment")
	}
	if p.OrgUnit == "" {
		p.OrgUnit = d.OrgUnit
	}
	if p.StudentID == "" {
		p.StudentID = d.StudentID
	}
	tx, err := s.db.Begin()
	if err != nil {
		return fees.Payment{}, err
	}
	defer tx.Rollback()
	priorOthers, err := paidExcluding(tx, p.DemandID, p.ID)
	if err != nil {
		return fees.Payment{}, err
	}
	if priorOthers+p.AmountPaise > d.AmountPaise {
		return fees.Payment{}, errors.New("fees: payment would overpay demand " + d.ID +
			" — outstanding " + strconv.FormatInt(d.AmountPaise-priorOthers, 10) + "p, tendered " + strconv.FormatInt(p.AmountPaise, 10) + "p")
	}
	if _, err := tx.Exec(`INSERT INTO fee_payments (`+feePaymentCols+`)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        ON CONFLICT (id) DO UPDATE SET demand_id=$2,org_unit=$3,student_id=$4,amount_paise=$5,mode=$6,reference=$7,paid_on=$8`,
		p.ID, p.DemandID, p.OrgUnit, p.StudentID, p.AmountPaise, p.Mode, p.Reference, p.PaidOn); err != nil {
		return fees.Payment{}, err
	}
	newStatus := fees.Pending
	if total := priorOthers + p.AmountPaise; total >= d.AmountPaise {
		newStatus = fees.Paid
	} else if total > 0 {
		newStatus = fees.Partial
	}
	if _, err := tx.Exec(`UPDATE fee_demands SET status=$2 WHERE id=$1`, d.ID, newStatus); err != nil {
		return fees.Payment{}, err
	}
	if err := tx.Commit(); err != nil {
		return fees.Payment{}, err
	}
	return p, nil
}

func (s *pgFeesStore) WaiveDemand(id string) (fees.Demand, error) {
	d, ok := s.GetDemand(id)
	if !ok {
		return fees.Demand{}, errors.New("fees: unknown demand " + id)
	}
	if d.Status == fees.Paid {
		return fees.Demand{}, errors.New("fees: a paid demand cannot be waived")
	}
	if d.Status == fees.Cancelled {
		return fees.Demand{}, errors.New("fees: a cancelled demand cannot be waived")
	}
	d.Status = fees.Waived
	if _, err := s.db.Exec(`UPDATE fee_demands SET status=$2 WHERE id=$1`, id, d.Status); err != nil {
		return fees.Demand{}, err
	}
	return d, nil
}

func (s *pgFeesStore) Outstanding(id string) int64 {
	d, ok := s.GetDemand(id)
	if !ok || !d.Open() {
		return 0
	}
	paid, err := paidExcluding(s.db, id, "")
	if err != nil {
		return 0
	}
	return d.AmountPaise - paid
}

func (s *pgFeesStore) ListDemands(f fees.DemandFilter) []fees.Demand {
	rows, err := s.db.Query(`SELECT ` + feeDemandCols + ` FROM fee_demands ORDER BY due_on, id`)
	if err != nil {
		return nil
	}
	defer rows.Close()
	var out []fees.Demand
	for rows.Next() {
		d, err := scanDemand(rows)
		if err != nil {
			continue
		}
		if fees.MatchDemand(f, d) {
			out = append(out, d)
		}
	}
	return out
}

func (s *pgFeesStore) ListPayments(f fees.PaymentFilter) []fees.Payment {
	rows, err := s.db.Query(`SELECT ` + feePaymentCols + ` FROM fee_payments ORDER BY paid_on DESC, id`)
	if err != nil {
		return nil
	}
	defer rows.Close()
	var out []fees.Payment
	for rows.Next() {
		p, err := scanPayment(rows)
		if err != nil {
			continue
		}
		if fees.MatchPayment(f, p) {
			out = append(out, p)
		}
	}
	return out
}
