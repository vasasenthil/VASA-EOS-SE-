package integration

import (
	"database/sql"
	"errors"
	"strconv"

	"github.com/vasa-eos-se-tn/platform/establishment"
)

// pgEstabStore is the durable PostgreSQL adapter for the establishment register (sanctioned posts +
// appointments). The over-appointment invariant is enforced against the durable filled count before each
// insert; the no-double-post-per-employee rule is backstopped by a partial unique index.
type pgEstabStore struct{ db *sql.DB }

func newPgEstabStore(dsn string) (*pgEstabStore, error) {
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, err
	}
	if err := db.Ping(); err != nil {
		return nil, err
	}
	s := &pgEstabStore{db: db}
	if err := s.ensureSchema(); err != nil {
		return nil, err
	}
	return s, nil
}

func (s *pgEstabStore) ensureSchema() error {
	_, err := s.db.Exec(`
CREATE TABLE IF NOT EXISTS establishments (
    id         TEXT PRIMARY KEY,
    org_unit   TEXT NOT NULL,
    cadre      TEXT NOT NULL,
    sanctioned INT  NOT NULL,
    status     TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS establishment_appointments (
    id               TEXT PRIMARY KEY,
    establishment_id TEXT NOT NULL,
    org_unit         TEXT NOT NULL,
    employee_id      TEXT NOT NULL,
    name             TEXT NOT NULL DEFAULT '',
    status           TEXT NOT NULL,
    appointed_on     TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS establishments_org_idx       ON establishments (org_unit, status);
CREATE INDEX IF NOT EXISTS estab_appts_establishment_idx ON establishment_appointments (establishment_id, status);
-- an employee holds at most one filled post per establishment.
CREATE UNIQUE INDEX IF NOT EXISTS estab_appts_emp_idx ON establishment_appointments (establishment_id, employee_id) WHERE status='filled';`)
	return err
}

const estabCols = "id,org_unit,cadre,sanctioned,status"
const estabApptCols = "id,establishment_id,org_unit,employee_id,name,status,appointed_on"

func scanEstablishment(row interface{ Scan(...any) error }) (establishment.Establishment, error) {
	var e establishment.Establishment
	err := row.Scan(&e.ID, &e.OrgUnit, &e.Cadre, &e.Sanctioned, &e.Status)
	return e, err
}

func scanAppointment(row interface{ Scan(...any) error }) (establishment.Appointment, error) {
	var a establishment.Appointment
	err := row.Scan(&a.ID, &a.EstablishmentID, &a.OrgUnit, &a.EmployeeID, &a.Name, &a.Status, &a.AppointedOn)
	return a, err
}

// UpsertEstablishment validates then upserts a sanctioned-post line by id.
func (s *pgEstabStore) UpsertEstablishment(e establishment.Establishment) (establishment.Establishment, error) {
	if e.Status == "" {
		e.Status = establishment.Active
	}
	if err := e.Validate(); err != nil {
		return establishment.Establishment{}, err
	}
	if _, err := s.db.Exec(`INSERT INTO establishments (`+estabCols+`)
        VALUES ($1,$2,$3,$4,$5)
        ON CONFLICT (id) DO UPDATE SET org_unit=$2,cadre=$3,sanctioned=$4,status=$5`,
		e.ID, e.OrgUnit, e.Cadre, e.Sanctioned, e.Status); err != nil {
		return establishment.Establishment{}, err
	}
	return e, nil
}

func (s *pgEstabStore) GetEstablishment(id string) (establishment.Establishment, bool) {
	e, err := scanEstablishment(s.db.QueryRow(`SELECT `+estabCols+` FROM establishments WHERE id=$1`, id))
	if err != nil {
		return establishment.Establishment{}, false
	}
	return e, true
}

// Appoint enforces the open, no-double-post and over-appointment invariants against the durable state, then inserts.
func (s *pgEstabStore) Appoint(a establishment.Appointment) (establishment.Appointment, error) {
	a.Status = establishment.Filled
	if err := a.Validate(); err != nil {
		return establishment.Appointment{}, err
	}
	e, ok := s.GetEstablishment(a.EstablishmentID)
	if !ok {
		return establishment.Appointment{}, errors.New("establishment: unknown establishment " + a.EstablishmentID)
	}
	if !e.Open() {
		return establishment.Appointment{}, errors.New("establishment: " + e.ID + " is " + e.Status + " and takes no new appointments")
	}
	if a.OrgUnit == "" {
		a.OrgUnit = e.OrgUnit
	}
	var dup string
	err := s.db.QueryRow(`SELECT id FROM establishment_appointments
        WHERE establishment_id=$1 AND employee_id=$2 AND status='filled' AND id<>$3 LIMIT 1`,
		a.EstablishmentID, a.EmployeeID, a.ID).Scan(&dup)
	if err == nil {
		return establishment.Appointment{}, errors.New("establishment: employee " + a.EmployeeID + " already holds a post here")
	} else if err != sql.ErrNoRows {
		return establishment.Appointment{}, err
	}
	var filled int
	if err := s.db.QueryRow(`SELECT count(*) FROM establishment_appointments WHERE establishment_id=$1 AND status='filled'`, a.EstablishmentID).Scan(&filled); err != nil {
		return establishment.Appointment{}, err
	}
	if filled >= e.Sanctioned {
		return establishment.Appointment{}, errors.New("establishment: " + e.ID + " is at sanctioned strength (" + strconv.Itoa(e.Sanctioned) + ")")
	}
	if _, err := s.db.Exec(`INSERT INTO establishment_appointments (`+estabApptCols+`)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        ON CONFLICT (id) DO UPDATE SET establishment_id=$2,org_unit=$3,employee_id=$4,name=$5,status=$6,appointed_on=$7`,
		a.ID, a.EstablishmentID, a.OrgUnit, a.EmployeeID, a.Name, a.Status, a.AppointedOn); err != nil {
		return establishment.Appointment{}, err
	}
	return a, nil
}

// Vacate flips a filled post to vacated (freeing it).
func (s *pgEstabStore) Vacate(id string) (establishment.Appointment, error) {
	a, err := scanAppointment(s.db.QueryRow(`SELECT `+estabApptCols+` FROM establishment_appointments WHERE id=$1`, id))
	if err != nil {
		return establishment.Appointment{}, errors.New("establishment: no such appointment " + id)
	}
	if a.Status != establishment.Filled {
		return establishment.Appointment{}, errors.New("establishment: only a filled post can be vacated")
	}
	a.Status = establishment.Vacated
	if _, err := s.db.Exec(`UPDATE establishment_appointments SET status=$2 WHERE id=$1`, id, a.Status); err != nil {
		return establishment.Appointment{}, err
	}
	return a, nil
}

func (s *pgEstabStore) Vacancies(id string) int {
	e, ok := s.GetEstablishment(id)
	if !ok {
		return 0
	}
	var filled int
	if err := s.db.QueryRow(`SELECT count(*) FROM establishment_appointments WHERE establishment_id=$1 AND status='filled'`, id).Scan(&filled); err != nil {
		return 0
	}
	v := e.Sanctioned - filled
	if v < 0 {
		return 0
	}
	return v
}

func (s *pgEstabStore) ListEstablishments(f establishment.EstablishmentFilter) []establishment.Establishment {
	rows, err := s.db.Query(`SELECT ` + estabCols + ` FROM establishments ORDER BY cadre, id`)
	if err != nil {
		return nil
	}
	defer rows.Close()
	var out []establishment.Establishment
	for rows.Next() {
		e, err := scanEstablishment(rows)
		if err != nil {
			continue
		}
		if establishment.MatchEstablishment(f, e) {
			out = append(out, e)
		}
	}
	return out
}

func (s *pgEstabStore) ListAppointments(f establishment.AppointmentFilter) []establishment.Appointment {
	rows, err := s.db.Query(`SELECT ` + estabApptCols + ` FROM establishment_appointments ORDER BY establishment_id, id`)
	if err != nil {
		return nil
	}
	defer rows.Close()
	var out []establishment.Appointment
	for rows.Next() {
		a, err := scanAppointment(rows)
		if err != nil {
			continue
		}
		if establishment.MatchAppointment(f, a) {
			out = append(out, a)
		}
	}
	return out
}
