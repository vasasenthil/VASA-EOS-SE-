package integration

import (
	"database/sql"
	"errors"

	"github.com/vasa-eos-se-tn/platform/transport"
)

// pgTransStore is the durable PostgreSQL adapter for school transport (routes + seat allotments). The capacity
// and serviceability safety invariants are enforced against the durable state before each insert; the
// one-active-seat-per-student-per-route rule is also backstopped by a partial unique index.
type pgTransStore struct{ db *sql.DB }

func newPgTransStore(dsn string) (*pgTransStore, error) {
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, err
	}
	if err := db.Ping(); err != nil {
		return nil, err
	}
	s := &pgTransStore{db: db}
	if err := s.ensureSchema(); err != nil {
		return nil, err
	}
	return s, nil
}

func (s *pgTransStore) ensureSchema() error {
	_, err := s.db.Exec(`
CREATE TABLE IF NOT EXISTS transport_routes (
    id                 TEXT PRIMARY KEY,
    org_unit           TEXT NOT NULL,
    name               TEXT NOT NULL DEFAULT '',
    vehicle_no         TEXT NOT NULL,
    capacity           INT  NOT NULL,
    fitness_valid_till TEXT NOT NULL,
    driver_name        TEXT NOT NULL DEFAULT '',
    licence_valid_till TEXT NOT NULL,
    status             TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS transport_allotments (
    id         TEXT PRIMARY KEY,
    route_id   TEXT NOT NULL,
    org_unit   TEXT NOT NULL,
    student_id TEXT NOT NULL,
    stop       TEXT NOT NULL DEFAULT '',
    status     TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS transport_allot_route_idx ON transport_allotments (route_id, status);
-- at most one active seat per student per route.
CREATE UNIQUE INDEX IF NOT EXISTS transport_allot_unique_idx ON transport_allotments (route_id, student_id) WHERE status='allotted';`)
	return err
}

const transRouteCols = "id,org_unit,name,vehicle_no,capacity,fitness_valid_till,driver_name,licence_valid_till,status"
const transAllotCols = "id,route_id,org_unit,student_id,stop,status"

func scanRoute(row interface{ Scan(...any) error }) (transport.Route, error) {
	var r transport.Route
	err := row.Scan(&r.ID, &r.OrgUnit, &r.Name, &r.VehicleNo, &r.Capacity, &r.FitnessValidTill, &r.DriverName, &r.LicenceValidTill, &r.Status)
	return r, err
}

func scanAllot(row interface{ Scan(...any) error }) (transport.Allotment, error) {
	var a transport.Allotment
	err := row.Scan(&a.ID, &a.RouteID, &a.OrgUnit, &a.StudentID, &a.Stop, &a.Status)
	return a, err
}

// UpsertRoute validates then upserts a route by id.
func (s *pgTransStore) UpsertRoute(r transport.Route) (transport.Route, error) {
	if err := r.Validate(); err != nil {
		return transport.Route{}, err
	}
	if _, err := s.db.Exec(`INSERT INTO transport_routes (`+transRouteCols+`)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        ON CONFLICT (id) DO UPDATE SET org_unit=$2,name=$3,vehicle_no=$4,capacity=$5,fitness_valid_till=$6,driver_name=$7,licence_valid_till=$8,status=$9`,
		r.ID, r.OrgUnit, r.Name, r.VehicleNo, r.Capacity, r.FitnessValidTill, r.DriverName, r.LicenceValidTill, r.Status); err != nil {
		return transport.Route{}, err
	}
	return r, nil
}

func (s *pgTransStore) GetRoute(id string) (transport.Route, bool) {
	r, err := scanRoute(s.db.QueryRow(`SELECT `+transRouteCols+` FROM transport_routes WHERE id=$1`, id))
	if err != nil {
		return transport.Route{}, false
	}
	return r, true
}

// Allot enforces the safety invariants against the durable state (serviceability + capacity + no duplicate seat)
// before inserting the seat.
func (s *pgTransStore) Allot(a transport.Allotment, asOf string) (transport.Allotment, error) {
	if err := a.Validate(); err != nil {
		return transport.Allotment{}, err
	}
	r, ok := s.GetRoute(a.RouteID)
	if !ok {
		return transport.Allotment{}, errors.New("transport: unknown route " + a.RouteID)
	}
	if reason := r.UnserviceableReason(asOf); reason != "" {
		return transport.Allotment{}, errors.New("transport: cannot allot to an unserviceable route — " + reason)
	}
	// duplicate active seat for the same student?
	var dup string
	err := s.db.QueryRow(`SELECT id FROM transport_allotments
        WHERE route_id=$1 AND student_id=$2 AND status='allotted' AND id<>$3 LIMIT 1`,
		a.RouteID, a.StudentID, a.ID).Scan(&dup)
	if err == nil {
		return transport.Allotment{}, errors.New("transport: student " + a.StudentID + " is already allotted to this route")
	} else if err != sql.ErrNoRows {
		return transport.Allotment{}, err
	}
	// capacity check against the durable occupancy.
	var seated int
	if err := s.db.QueryRow(`SELECT count(*) FROM transport_allotments WHERE route_id=$1 AND status='allotted'`, a.RouteID).Scan(&seated); err != nil {
		return transport.Allotment{}, err
	}
	if seated >= r.Capacity {
		return transport.Allotment{}, errors.New("transport: route " + a.RouteID + " is at capacity")
	}
	if _, err := s.db.Exec(`INSERT INTO transport_allotments (`+transAllotCols+`)
        VALUES ($1,$2,$3,$4,$5,$6)
        ON CONFLICT (id) DO UPDATE SET route_id=$2,org_unit=$3,student_id=$4,stop=$5,status=$6`,
		a.ID, a.RouteID, a.OrgUnit, a.StudentID, a.Stop, a.Status); err != nil {
		return transport.Allotment{}, err
	}
	return a, nil
}

// Withdraw flips an active seat to withdrawn (freeing capacity).
func (s *pgTransStore) Withdraw(id string) (transport.Allotment, error) {
	a, err := scanAllot(s.db.QueryRow(`SELECT `+transAllotCols+` FROM transport_allotments WHERE id=$1`, id))
	if err != nil {
		return transport.Allotment{}, errors.New("transport: no such allotment " + id)
	}
	if a.Status != transport.Allotted {
		return transport.Allotment{}, errors.New("transport: only an active seat can be withdrawn")
	}
	a.Status = transport.Withdrawn
	if _, err := s.db.Exec(`UPDATE transport_allotments SET status=$2 WHERE id=$1`, id, a.Status); err != nil {
		return transport.Allotment{}, err
	}
	return a, nil
}

func (s *pgTransStore) ListRoutes(f transport.RouteFilter) []transport.Route {
	rows, err := s.db.Query(`SELECT ` + transRouteCols + ` FROM transport_routes ORDER BY id`)
	if err != nil {
		return nil
	}
	defer rows.Close()
	var out []transport.Route
	for rows.Next() {
		r, err := scanRoute(rows)
		if err != nil {
			continue
		}
		if transport.MatchRoute(f, r) {
			out = append(out, r)
		}
	}
	return out
}

func (s *pgTransStore) ListAllotments(f transport.AllotmentFilter) []transport.Allotment {
	rows, err := s.db.Query(`SELECT ` + transAllotCols + ` FROM transport_allotments ORDER BY route_id, id`)
	if err != nil {
		return nil
	}
	defer rows.Close()
	var out []transport.Allotment
	for rows.Next() {
		a, err := scanAllot(rows)
		if err != nil {
			continue
		}
		if transport.MatchAllotment(f, a) {
			out = append(out, a)
		}
	}
	return out
}
