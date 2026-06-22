package integration

import (
	"database/sql"
	"errors"
	"strconv"

	"github.com/vasa-eos-se-tn/platform/ptm"
)

// pgPtmStore is the durable PostgreSQL adapter for PTM (sessions + bookings). The overbooking and
// double-booking invariants are enforced against the durable bookings before each insert; the attendance
// transitions reuse the pure Apply* functions.
type pgPtmStore struct{ db *sql.DB }

func newPgPtmStore(dsn string) (*pgPtmStore, error) {
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, err
	}
	if err := db.Ping(); err != nil {
		return nil, err
	}
	s := &pgPtmStore{db: db}
	if err := s.ensureSchema(); err != nil {
		return nil, err
	}
	return s, nil
}

func (s *pgPtmStore) ensureSchema() error {
	_, err := s.db.Exec(`
CREATE TABLE IF NOT EXISTS ptm_sessions (
    id       TEXT PRIMARY KEY,
    org_unit TEXT NOT NULL,
    title    TEXT NOT NULL,
    date     TEXT NOT NULL,
    slots    INT  NOT NULL,
    status   TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS ptm_bookings (
    id         TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    org_unit   TEXT NOT NULL,
    student_id TEXT NOT NULL,
    guardian   TEXT NOT NULL DEFAULT '',
    status     TEXT NOT NULL,
    slot       TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS ptm_bookings_session_idx ON ptm_bookings (session_id, status);
-- a student holds at most one active (non-cancelled) booking per session.
CREATE UNIQUE INDEX IF NOT EXISTS ptm_bookings_active_idx ON ptm_bookings (session_id, student_id) WHERE status<>'cancelled';`)
	return err
}

const ptmSessionCols = "id,org_unit,title,date,slots,status"
const ptmBookingCols = "id,session_id,org_unit,student_id,guardian,status,slot"

func scanSession(row interface{ Scan(...any) error }) (ptm.Session, error) {
	var sess ptm.Session
	err := row.Scan(&sess.ID, &sess.OrgUnit, &sess.Title, &sess.Date, &sess.Slots, &sess.Status)
	return sess, err
}

func scanBooking(row interface{ Scan(...any) error }) (ptm.Booking, error) {
	var b ptm.Booking
	err := row.Scan(&b.ID, &b.SessionID, &b.OrgUnit, &b.StudentID, &b.Guardian, &b.Status, &b.Slot)
	return b, err
}

// UpsertSession validates then upserts a session by id.
func (s *pgPtmStore) UpsertSession(sess ptm.Session) (ptm.Session, error) {
	if err := sess.Validate(); err != nil {
		return ptm.Session{}, err
	}
	if _, err := s.db.Exec(`INSERT INTO ptm_sessions (`+ptmSessionCols+`)
        VALUES ($1,$2,$3,$4,$5,$6)
        ON CONFLICT (id) DO UPDATE SET org_unit=$2,title=$3,date=$4,slots=$5,status=$6`,
		sess.ID, sess.OrgUnit, sess.Title, sess.Date, sess.Slots, sess.Status); err != nil {
		return ptm.Session{}, err
	}
	return sess, nil
}

func (s *pgPtmStore) GetSession(id string) (ptm.Session, bool) {
	sess, err := scanSession(s.db.QueryRow(`SELECT `+ptmSessionCols+` FROM ptm_sessions WHERE id=$1`, id))
	if err != nil {
		return ptm.Session{}, false
	}
	return sess, true
}

func (s *pgPtmStore) GetBooking(id string) (ptm.Booking, bool) {
	b, err := scanBooking(s.db.QueryRow(`SELECT `+ptmBookingCols+` FROM ptm_bookings WHERE id=$1`, id))
	if err != nil {
		return ptm.Booking{}, false
	}
	return b, true
}

// Book enforces the session-open, no-double-book and capacity invariants against the durable bookings, then inserts.
func (s *pgPtmStore) Book(b ptm.Booking) (ptm.Booking, error) {
	b.Status = ptm.Booked
	if err := b.Validate(); err != nil {
		return ptm.Booking{}, err
	}
	sess, ok := s.GetSession(b.SessionID)
	if !ok {
		return ptm.Booking{}, errors.New("ptm: unknown session " + b.SessionID)
	}
	if sess.Status == ptm.Cancelled {
		return ptm.Booking{}, errors.New("ptm: session " + sess.ID + " is cancelled and takes no bookings")
	}
	if b.OrgUnit == "" {
		b.OrgUnit = sess.OrgUnit
	}
	var dup string
	err := s.db.QueryRow(`SELECT id FROM ptm_bookings
        WHERE session_id=$1 AND student_id=$2 AND status<>'cancelled' AND id<>$3 LIMIT 1`,
		b.SessionID, b.StudentID, b.ID).Scan(&dup)
	if err == nil {
		return ptm.Booking{}, errors.New("ptm: student " + b.StudentID + " already has a booking in this session")
	} else if err != sql.ErrNoRows {
		return ptm.Booking{}, err
	}
	var occupied int
	if err := s.db.QueryRow(`SELECT count(*) FROM ptm_bookings WHERE session_id=$1 AND status<>'cancelled'`, b.SessionID).Scan(&occupied); err != nil {
		return ptm.Booking{}, err
	}
	if occupied >= sess.Slots {
		return ptm.Booking{}, errors.New("ptm: session " + sess.ID + " is full (" + strconv.Itoa(sess.Slots) + " slots)")
	}
	if _, err := s.db.Exec(`INSERT INTO ptm_bookings (`+ptmBookingCols+`)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        ON CONFLICT (id) DO UPDATE SET session_id=$2,org_unit=$3,student_id=$4,guardian=$5,status=$6,slot=$7`,
		b.ID, b.SessionID, b.OrgUnit, b.StudentID, b.Guardian, b.Status, b.Slot); err != nil {
		return ptm.Booking{}, err
	}
	return b, nil
}

func (s *pgPtmStore) transition(id string, fn func(ptm.Booking) (ptm.Booking, error)) (ptm.Booking, error) {
	b, ok := s.GetBooking(id)
	if !ok {
		return ptm.Booking{}, errors.New("ptm: no such booking " + id)
	}
	out, err := fn(b)
	if err != nil {
		return ptm.Booking{}, err
	}
	if _, err := s.db.Exec(`UPDATE ptm_bookings SET status=$2 WHERE id=$1`, id, out.Status); err != nil {
		return ptm.Booking{}, err
	}
	return out, nil
}

func (s *pgPtmStore) MarkAttended(id string) (ptm.Booking, error) {
	return s.transition(id, ptm.ApplyAttend)
}
func (s *pgPtmStore) MarkNoShow(id string) (ptm.Booking, error) {
	return s.transition(id, ptm.ApplyNoShow)
}
func (s *pgPtmStore) CancelBooking(id string) (ptm.Booking, error) {
	return s.transition(id, ptm.ApplyCancel)
}

func (s *pgPtmStore) ListSessions(f ptm.SessionFilter) []ptm.Session {
	rows, err := s.db.Query(`SELECT ` + ptmSessionCols + ` FROM ptm_sessions ORDER BY date, id`)
	if err != nil {
		return nil
	}
	defer rows.Close()
	var out []ptm.Session
	for rows.Next() {
		sess, err := scanSession(rows)
		if err != nil {
			continue
		}
		if ptm.MatchSession(f, sess) {
			out = append(out, sess)
		}
	}
	return out
}

func (s *pgPtmStore) ListBookings(f ptm.BookingFilter) []ptm.Booking {
	rows, err := s.db.Query(`SELECT ` + ptmBookingCols + ` FROM ptm_bookings ORDER BY session_id, id`)
	if err != nil {
		return nil
	}
	defer rows.Close()
	var out []ptm.Booking
	for rows.Next() {
		b, err := scanBooking(rows)
		if err != nil {
			continue
		}
		if ptm.MatchBooking(f, b) {
			out = append(out, b)
		}
	}
	return out
}
