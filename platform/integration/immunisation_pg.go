package integration

import (
	"database/sql"
	"errors"
	"strconv"
	"time"

	"github.com/vasa-eos-se-tn/platform/immunisation"
)

// pgImmStore is the durable PostgreSQL adapter for the immunisation register. The schedule, no-future-date,
// sequence and no-duplicate-slot invariants are enforced against the durable doses (reusing the pure helpers)
// before the upsert.
type pgImmStore struct{ db *sql.DB }

func newPgImmStore(dsn string) (*pgImmStore, error) {
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, err
	}
	if err := db.Ping(); err != nil {
		return nil, err
	}
	s := &pgImmStore{db: db}
	if err := s.ensureSchema(); err != nil {
		return nil, err
	}
	return s, nil
}

func (s *pgImmStore) ensureSchema() error {
	_, err := s.db.Exec(`
CREATE TABLE IF NOT EXISTS immunisation_doses (
    id              TEXT PRIMARY KEY,
    student_id      TEXT NOT NULL,
    org_unit        TEXT NOT NULL,
    vaccine         TEXT NOT NULL,
    dose_number     INT  NOT NULL,
    administered_on TEXT NOT NULL,
    batch           TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS immunisation_student_idx ON immunisation_doses (student_id, vaccine);
CREATE INDEX IF NOT EXISTS immunisation_org_idx     ON immunisation_doses (org_unit);
-- a student can hold a given vaccine dose number at most once (backstops the no-duplicate-slot invariant).
CREATE UNIQUE INDEX IF NOT EXISTS immunisation_dose_slot_idx ON immunisation_doses (student_id, vaccine, dose_number);`)
	return err
}

const immCols = "id,student_id,org_unit,vaccine,dose_number,administered_on,batch"

func scanDose(row interface{ Scan(...any) error }) (immunisation.DoseRecord, error) {
	var d immunisation.DoseRecord
	err := row.Scan(&d.ID, &d.StudentID, &d.OrgUnit, &d.Vaccine, &d.DoseNumber, &d.AdministeredOn, &d.Batch)
	return d, err
}

// dosesFor loads the existing dose records for a student+vaccine (for the sequence/duplicate checks).
func (s *pgImmStore) dosesFor(student, vaccine string) ([]immunisation.DoseRecord, error) {
	rows, err := s.db.Query(`SELECT `+immCols+` FROM immunisation_doses WHERE student_id=$1 AND vaccine=$2`, student, vaccine)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []immunisation.DoseRecord
	for rows.Next() {
		d, err := scanDose(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, d)
	}
	return out, nil
}

// AdministerDose enforces the same invariants as the in-memory store against the durable doses, then upserts.
func (s *pgImmStore) AdministerDose(d immunisation.DoseRecord) (immunisation.DoseRecord, error) {
	today := time.Now().UTC().Format("2006-01-02")
	if err := d.Validate(today); err != nil {
		return immunisation.DoseRecord{}, err
	}
	existing, err := s.dosesFor(d.StudentID, d.Vaccine)
	if err != nil {
		return immunisation.DoseRecord{}, err
	}
	given := immunisation.DosesGivenExcluding(existing, d.StudentID, d.Vaccine, d.ID)
	for n := 1; n < d.DoseNumber; n++ {
		if !given[n] {
			return immunisation.DoseRecord{}, errors.New("immunisation: out-of-sequence dose — " + d.Vaccine + " dose " +
				strconv.Itoa(d.DoseNumber) + " requires dose " + strconv.Itoa(n) + " first")
		}
	}
	if given[d.DoseNumber] {
		return immunisation.DoseRecord{}, errors.New("immunisation: " + d.Vaccine + " dose " + strconv.Itoa(d.DoseNumber) + " is already recorded for this student")
	}
	if _, err := s.db.Exec(`INSERT INTO immunisation_doses (`+immCols+`)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        ON CONFLICT (id) DO UPDATE SET student_id=$2,org_unit=$3,vaccine=$4,dose_number=$5,administered_on=$6,batch=$7`,
		d.ID, d.StudentID, d.OrgUnit, d.Vaccine, d.DoseNumber, d.AdministeredOn, d.Batch); err != nil {
		return immunisation.DoseRecord{}, err
	}
	return d, nil
}

func (s *pgImmStore) Get(id string) (immunisation.DoseRecord, bool) {
	d, err := scanDose(s.db.QueryRow(`SELECT `+immCols+` FROM immunisation_doses WHERE id=$1`, id))
	if err != nil {
		return immunisation.DoseRecord{}, false
	}
	return d, true
}

func (s *pgImmStore) List(f immunisation.Filter) []immunisation.DoseRecord {
	rows, err := s.db.Query(`SELECT ` + immCols + ` FROM immunisation_doses ORDER BY administered_on, id`)
	if err != nil {
		return nil
	}
	defer rows.Close()
	var out []immunisation.DoseRecord
	for rows.Next() {
		d, err := scanDose(rows)
		if err != nil {
			continue
		}
		if immunisation.Match(f, d) {
			out = append(out, d)
		}
	}
	return out
}
