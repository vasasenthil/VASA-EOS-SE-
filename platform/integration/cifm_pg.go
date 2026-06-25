package integration

import (
	"database/sql"
	"encoding/json"
)

// pgFacilityStore is the durable PostgreSQL adapter for CIFM (campus facilities + work orders).
type pgFacilityStore struct{ db *sql.DB }

func newPgFacilityStore(dsn string) (*pgFacilityStore, error) {
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, err
	}
	if err := db.Ping(); err != nil {
		return nil, err
	}
	s := &pgFacilityStore{db: db}
	if err := s.ensureSchema(); err != nil {
		return nil, err
	}
	return s, nil
}

func (s *pgFacilityStore) ensureSchema() error {
	_, err := s.db.Exec(`
CREATE TABLE IF NOT EXISTS facilities (
    id          TEXT PRIMARY KEY,
    org_unit    TEXT NOT NULL,
    name        TEXT NOT NULL,
    category    TEXT NOT NULL,
    condition   TEXT NOT NULL DEFAULT 'good',
    status      TEXT NOT NULL,
    amc_vendor  TEXT NOT NULL DEFAULT '',
    amc_expiry  TEXT NOT NULL DEFAULT '',
    work_orders TEXT NOT NULL DEFAULT '[]',
    created_on  TEXT NOT NULL DEFAULT '',
    updated_at  TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS facility_org_idx    ON facilities (org_unit);
CREATE INDEX IF NOT EXISTS facility_status_idx ON facilities (status);`)
	return err
}

const facilityCols = "id,org_unit,name,category,condition,status,amc_vendor,amc_expiry,work_orders,created_on,updated_at"

func scanFacility(row interface{ Scan(...any) error }) (Facility, error) {
	var f Facility
	var workOrders string
	err := row.Scan(&f.ID, &f.OrgUnit, &f.Name, &f.Category, &f.Condition, &f.Status, &f.AMCVendor, &f.AMCExpiry,
		&workOrders, &f.CreatedOn, &f.UpdatedAt)
	if err != nil {
		return Facility{}, err
	}
	if workOrders != "" && workOrders != "[]" {
		_ = json.Unmarshal([]byte(workOrders), &f.WorkOrders)
	}
	return f, nil
}

func (s *pgFacilityStore) Upsert(f Facility) (Facility, error) {
	workOrders, err := json.Marshal(f.WorkOrders)
	if err != nil {
		return Facility{}, err
	}
	if len(f.WorkOrders) == 0 {
		workOrders = []byte("[]")
	}
	if _, err := s.db.Exec(`INSERT INTO facilities (`+facilityCols+`)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        ON CONFLICT (id) DO UPDATE SET org_unit=$2,name=$3,category=$4,condition=$5,status=$6,amc_vendor=$7,
            amc_expiry=$8,work_orders=$9,created_on=$10,updated_at=$11`,
		f.ID, f.OrgUnit, f.Name, f.Category, f.Condition, f.Status, f.AMCVendor, f.AMCExpiry, string(workOrders), f.CreatedOn, f.UpdatedAt); err != nil {
		return Facility{}, err
	}
	return f, nil
}

func (s *pgFacilityStore) Get(id string) (Facility, bool) {
	f, err := scanFacility(s.db.QueryRow(`SELECT `+facilityCols+` FROM facilities WHERE id=$1`, id))
	if err != nil {
		return Facility{}, false
	}
	return f, true
}

func (s *pgFacilityStore) List(ff facilityFilter) []Facility {
	rows, err := s.db.Query(`SELECT ` + facilityCols + ` FROM facilities`)
	if err != nil {
		return nil
	}
	defer rows.Close()
	var out []Facility
	for rows.Next() {
		f, err := scanFacility(rows)
		if err != nil {
			continue
		}
		if matchFacility(ff, f) {
			out = append(out, f)
		}
	}
	return out
}
