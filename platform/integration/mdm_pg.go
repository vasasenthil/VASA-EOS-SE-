package integration

import (
	"database/sql"
	"errors"
	"strconv"

	"github.com/vasa-eos-se-tn/platform/mdm"
)

// pgMdmStore is the durable PostgreSQL adapter for Mid-Day Meal (PM-POSHAN). The stock-non-negative invariant is
// enforced against the durable balance inside the same transaction that writes the meal + its consumption
// ledger entry, so a day's service and its stock draw-down are atomic.
type pgMdmStore struct{ db *sql.DB }

func newPgMdmStore(dsn string) (*pgMdmStore, error) {
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, err
	}
	if err := db.Ping(); err != nil {
		return nil, err
	}
	s := &pgMdmStore{db: db}
	if err := s.ensureSchema(); err != nil {
		return nil, err
	}
	return s, nil
}

func (s *pgMdmStore) ensureSchema() error {
	_, err := s.db.Exec(`
CREATE TABLE IF NOT EXISTS mdm_ledger (
    id          TEXT PRIMARY KEY,
    org_unit    TEXT   NOT NULL,
    date        TEXT   NOT NULL,
    kind        TEXT   NOT NULL,
    grain_grams BIGINT NOT NULL,
    note        TEXT   NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS mdm_meals (
    id           TEXT PRIMARY KEY,
    org_unit     TEXT   NOT NULL,
    date         TEXT   NOT NULL,
    meals_served INT    NOT NULL,
    enrolment    INT    NOT NULL,
    grain_grams  BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS mdm_ledger_org_idx ON mdm_ledger (org_unit, kind);
CREATE INDEX IF NOT EXISTS mdm_meals_org_idx  ON mdm_meals (org_unit, date);`)
	return err
}

const mdmLedgerCols = "id,org_unit,date,kind,grain_grams,note"
const mdmMealCols = "id,org_unit,date,meals_served,enrolment,grain_grams"

func scanLedger(row interface{ Scan(...any) error }) (mdm.LedgerEntry, error) {
	var e mdm.LedgerEntry
	err := row.Scan(&e.ID, &e.OrgUnit, &e.Date, &e.Kind, &e.GrainGrams, &e.Note)
	return e, err
}

func scanMeal(row interface{ Scan(...any) error }) (mdm.MealDay, error) {
	var m mdm.MealDay
	err := row.Scan(&m.ID, &m.OrgUnit, &m.Date, &m.MealsServed, &m.Enrolment, &m.GrainGrams)
	return m, err
}

// balanceExcluding returns a school's stock (receipts minus consumptions) from a queryer, excluding one entry id.
func balanceExcluding(q interface {
	QueryRow(string, ...any) *sql.Row
}, org, excludeID string) (int64, error) {
	var bal sql.NullInt64
	err := q.QueryRow(`SELECT COALESCE(SUM(CASE WHEN kind='receipt' THEN grain_grams ELSE -grain_grams END),0)
        FROM mdm_ledger WHERE org_unit=$1 AND id<>$2`, org, excludeID).Scan(&bal)
	if err != nil {
		return 0, err
	}
	return bal.Int64, nil
}

func (s *pgMdmStore) Balance(org string) int64 {
	bal, err := balanceExcluding(s.db, org, "")
	if err != nil {
		return 0
	}
	return bal
}

// Receive upserts a foodgrain receipt.
func (s *pgMdmStore) Receive(e mdm.LedgerEntry) (mdm.LedgerEntry, error) {
	e.Kind = mdm.Receipt
	if err := e.Validate(); err != nil {
		return mdm.LedgerEntry{}, err
	}
	if _, err := s.db.Exec(`INSERT INTO mdm_ledger (`+mdmLedgerCols+`)
        VALUES ($1,$2,$3,$4,$5,$6)
        ON CONFLICT (id) DO UPDATE SET org_unit=$2,date=$3,kind=$4,grain_grams=$5,note=$6`,
		e.ID, e.OrgUnit, e.Date, e.Kind, e.GrainGrams, e.Note); err != nil {
		return mdm.LedgerEntry{}, err
	}
	return e, nil
}

// Serve validates, then in one transaction checks the stock invariant against the durable balance and writes
// the meal record + its matching consumption ledger entry.
func (s *pgMdmStore) Serve(m mdm.MealDay) (mdm.MealDay, error) {
	if err := m.Validate(); err != nil {
		return mdm.MealDay{}, err
	}
	if m.MealsServed > m.Enrolment {
		return mdm.MealDay{}, errors.New("mdm: meals served (" + strconv.Itoa(m.MealsServed) + ") cannot exceed enrolment (" + strconv.Itoa(m.Enrolment) + ")")
	}
	tx, err := s.db.Begin()
	if err != nil {
		return mdm.MealDay{}, err
	}
	defer tx.Rollback()
	avail, err := balanceExcluding(tx, m.OrgUnit, m.ID)
	if err != nil {
		return mdm.MealDay{}, err
	}
	if m.GrainGrams > avail {
		return mdm.MealDay{}, errors.New("mdm: insufficient foodgrain stock — need " + strconv.FormatInt(m.GrainGrams, 10) + "g, have " + strconv.FormatInt(avail, 10) + "g")
	}
	if _, err := tx.Exec(`INSERT INTO mdm_meals (`+mdmMealCols+`)
        VALUES ($1,$2,$3,$4,$5,$6)
        ON CONFLICT (id) DO UPDATE SET org_unit=$2,date=$3,meals_served=$4,enrolment=$5,grain_grams=$6`,
		m.ID, m.OrgUnit, m.Date, m.MealsServed, m.Enrolment, m.GrainGrams); err != nil {
		return mdm.MealDay{}, err
	}
	if _, err := tx.Exec(`INSERT INTO mdm_ledger (`+mdmLedgerCols+`)
        VALUES ($1,$2,$3,'consumption',$4,$5)
        ON CONFLICT (id) DO UPDATE SET org_unit=$2,date=$3,kind='consumption',grain_grams=$4,note=$5`,
		m.ID, m.OrgUnit, m.Date, m.GrainGrams, "MDM service "+m.Date); err != nil {
		return mdm.MealDay{}, err
	}
	if err := tx.Commit(); err != nil {
		return mdm.MealDay{}, err
	}
	return m, nil
}

func (s *pgMdmStore) GetMeal(id string) (mdm.MealDay, bool) {
	m, err := scanMeal(s.db.QueryRow(`SELECT `+mdmMealCols+` FROM mdm_meals WHERE id=$1`, id))
	if err != nil {
		return mdm.MealDay{}, false
	}
	return m, true
}

func (s *pgMdmStore) ListLedger(f mdm.LedgerFilter) []mdm.LedgerEntry {
	rows, err := s.db.Query(`SELECT ` + mdmLedgerCols + ` FROM mdm_ledger ORDER BY date, id`)
	if err != nil {
		return nil
	}
	defer rows.Close()
	var out []mdm.LedgerEntry
	for rows.Next() {
		e, err := scanLedger(rows)
		if err != nil {
			continue
		}
		if mdm.MatchLedger(f, e) {
			out = append(out, e)
		}
	}
	return out
}

func (s *pgMdmStore) ListMeals(f mdm.MealFilter) []mdm.MealDay {
	rows, err := s.db.Query(`SELECT ` + mdmMealCols + ` FROM mdm_meals ORDER BY date DESC, id`)
	if err != nil {
		return nil
	}
	defer rows.Close()
	var out []mdm.MealDay
	for rows.Next() {
		m, err := scanMeal(rows)
		if err != nil {
			continue
		}
		if mdm.MatchMeal(f, m) {
			out = append(out, m)
		}
	}
	return out
}
