// Package ptm is the L6 Parent-Teacher Meeting service: scheduled PTM sessions at a school and the guardian
// bookings against them, as a capacity-checked booking system with an attendance lifecycle. It holds the
// invariants a meeting register must keep — a session can never be OVERBOOKED beyond its slots, a guardian can
// never double-book the same session, a cancelled session takes no bookings, and a booking walks
// booked → attended | no_show (a cancellation frees its slot). Turnout (attended vs booked) is derived. Pure +
// stdlib-only.
package ptm

import (
	"errors"
	"sort"
	"strconv"
	"time"
)

// Session statuses.
const (
	Scheduled = "scheduled"
	Cancelled = "cancelled"
)

// Booking statuses.
const (
	Booked           = "booked"
	Attended         = "attended"
	NoShow           = "no_show"
	BookingCancelled = "cancelled"
)

const dateLayout = "2006-01-02"

func parseDate(s string) (time.Time, error) { return time.Parse(dateLayout, s) }

// Session is a scheduled parent-teacher meeting at a school, offering a fixed number of booking slots.
type Session struct {
	ID      string `json:"id"`
	OrgUnit string `json:"org_unit"` // the school (T6 tenancy node)
	Title   string `json:"title"`
	Date    string `json:"date"` // YYYY-MM-DD
	Slots   int    `json:"slots"`
	Status  string `json:"status"`
}

func validSessionStatus(s string) bool { return s == Scheduled || s == Cancelled }

// Validate checks a session's required fields, slots, status and date.
func (s Session) Validate() error {
	if s.ID == "" || s.OrgUnit == "" || s.Title == "" {
		return errors.New("ptm: session id, org_unit and title are required")
	}
	if s.Slots <= 0 || s.Slots > 1000 {
		return errors.New("ptm: slots must be 1..1000")
	}
	if !validSessionStatus(s.Status) {
		return errors.New("ptm: invalid session status " + s.Status)
	}
	if _, err := parseDate(s.Date); err != nil {
		return errors.New("ptm: invalid date (want YYYY-MM-DD)")
	}
	return nil
}

// Booking is a guardian's reserved slot in a session, tracked through the attendance lifecycle.
type Booking struct {
	ID        string `json:"id"`
	SessionID string `json:"session_id"`
	OrgUnit   string `json:"org_unit"`
	StudentID string `json:"student_id"`
	Guardian  string `json:"guardian"`
	Status    string `json:"status"`
	Slot      string `json:"slot,omitempty"` // optional time-slot label
}

func validBookingStatus(s string) bool {
	switch s {
	case Booked, Attended, NoShow, BookingCancelled:
		return true
	}
	return false
}

// Validate checks a booking's required fields and status.
func (b Booking) Validate() error {
	if b.ID == "" || b.SessionID == "" || b.StudentID == "" {
		return errors.New("ptm: booking id, session_id and student_id are required")
	}
	if !validBookingStatus(b.Status) {
		return errors.New("ptm: invalid booking status " + b.Status)
	}
	return nil
}

// Occupies reports whether a booking consumes a slot (anything but a cancelled booking).
func (b Booking) Occupies() bool { return b.Status != BookingCancelled }

// Occupied counts the slots consumed in a session across a set of bookings (everything but cancellations).
func Occupied(bookings []Booking, sessionID string) int {
	n := 0
	for _, b := range bookings {
		if b.SessionID == sessionID && b.Occupies() {
			n++
		}
	}
	return n
}

// ApplyAttend marks a booked slot attended.
func ApplyAttend(b Booking) (Booking, error) {
	if b.Status != Booked {
		return Booking{}, errors.New("ptm: only a booked slot can be marked attended")
	}
	b.Status = Attended
	return b, nil
}

// ApplyNoShow marks a booked slot a no-show.
func ApplyNoShow(b Booking) (Booking, error) {
	if b.Status != Booked {
		return Booking{}, errors.New("ptm: only a booked slot can be marked a no-show")
	}
	b.Status = NoShow
	return b, nil
}

// ApplyCancel cancels a booked slot (freeing it). An attended/no-show slot cannot be cancelled.
func ApplyCancel(b Booking) (Booking, error) {
	if b.Status != Booked {
		return Booking{}, errors.New("ptm: only a booked slot can be cancelled")
	}
	b.Status = BookingCancelled
	return b, nil
}

// SessionFilter narrows a session listing.
type SessionFilter struct {
	OrgUnit string
	Status  string
}

// MatchSession reports whether a session satisfies a filter (exported for persistence adapters).
func MatchSession(f SessionFilter, s Session) bool {
	if f.OrgUnit != "" && s.OrgUnit != f.OrgUnit {
		return false
	}
	if f.Status != "" && s.Status != f.Status {
		return false
	}
	return true
}

// BookingFilter narrows a booking listing.
type BookingFilter struct {
	OrgUnit   string
	SessionID string
	Student   string
	Status    string
}

// MatchBooking reports whether a booking satisfies a filter (exported for persistence adapters).
func MatchBooking(f BookingFilter, b Booking) bool {
	if f.OrgUnit != "" && b.OrgUnit != f.OrgUnit {
		return false
	}
	if f.SessionID != "" && b.SessionID != f.SessionID {
		return false
	}
	if f.Student != "" && b.StudentID != f.Student {
		return false
	}
	if f.Status != "" && b.Status != f.Status {
		return false
	}
	return true
}

// Store is the in-memory PTM store holding sessions and their bookings (credential-free demo).
type Store struct {
	sessions map[string]Session
	bookings map[string]Booking
}

// NewStore returns an empty store.
func NewStore() *Store {
	return &Store{sessions: map[string]Session{}, bookings: map[string]Booking{}}
}

// UpsertSession validates and stores (or updates) a session by id.
func (s *Store) UpsertSession(sess Session) (Session, error) {
	if err := sess.Validate(); err != nil {
		return Session{}, err
	}
	s.sessions[sess.ID] = sess
	return sess, nil
}

// GetSession returns a session by id.
func (s *Store) GetSession(id string) (Session, bool) { sess, ok := s.sessions[id]; return sess, ok }

func (s *Store) listBookings() []Booking {
	out := make([]Booking, 0, len(s.bookings))
	for _, b := range s.bookings {
		out = append(out, b)
	}
	return out
}

// studentActiveIn reports whether a student already holds a non-cancelled booking in a session (other than excludeID).
func (s *Store) studentActiveIn(sessionID, student, excludeID string) bool {
	for id, b := range s.bookings {
		if id == excludeID {
			continue
		}
		if b.SessionID == sessionID && b.StudentID == student && b.Occupies() {
			return true
		}
	}
	return false
}

// Book reserves a slot for a guardian in a session, enforcing that the session is open (scheduled), the guardian
// is not double-booking, and the session is not already full.
func (s *Store) Book(b Booking) (Booking, error) {
	b.Status = Booked
	if err := b.Validate(); err != nil {
		return Booking{}, err
	}
	sess, ok := s.sessions[b.SessionID]
	if !ok {
		return Booking{}, errors.New("ptm: unknown session " + b.SessionID)
	}
	if sess.Status == Cancelled {
		return Booking{}, errors.New("ptm: session " + sess.ID + " is cancelled and takes no bookings")
	}
	if s.studentActiveIn(b.SessionID, b.StudentID, b.ID) {
		return Booking{}, errors.New("ptm: student " + b.StudentID + " already has a booking in this session")
	}
	if Occupied(s.listBookings(), b.SessionID) >= sess.Slots {
		return Booking{}, errors.New("ptm: session " + sess.ID + " is full (" + strconv.Itoa(sess.Slots) + " slots)")
	}
	if b.OrgUnit == "" {
		b.OrgUnit = sess.OrgUnit
	}
	s.bookings[b.ID] = b
	return b, nil
}

func (s *Store) transition(id string, fn func(Booking) (Booking, error)) (Booking, error) {
	b, ok := s.bookings[id]
	if !ok {
		return Booking{}, errors.New("ptm: no such booking " + id)
	}
	out, err := fn(b)
	if err != nil {
		return Booking{}, err
	}
	s.bookings[id] = out
	return out, nil
}

// MarkAttended marks a booked slot attended.
func (s *Store) MarkAttended(id string) (Booking, error) { return s.transition(id, ApplyAttend) }

// MarkNoShow marks a booked slot a no-show.
func (s *Store) MarkNoShow(id string) (Booking, error) { return s.transition(id, ApplyNoShow) }

// CancelBooking cancels a booked slot (freeing it).
func (s *Store) CancelBooking(id string) (Booking, error) { return s.transition(id, ApplyCancel) }

// GetBooking returns a booking by id.
func (s *Store) GetBooking(id string) (Booking, bool) { b, ok := s.bookings[id]; return b, ok }

// ListSessions returns the filtered sessions ordered by date then id.
func (s *Store) ListSessions(f SessionFilter) []Session {
	var out []Session
	for _, sess := range s.sessions {
		if MatchSession(f, sess) {
			out = append(out, sess)
		}
	}
	sort.Slice(out, func(i, j int) bool {
		if out[i].Date != out[j].Date {
			return out[i].Date < out[j].Date
		}
		return out[i].ID < out[j].ID
	})
	return out
}

// ListBookings returns the filtered bookings ordered by session then id.
func (s *Store) ListBookings(f BookingFilter) []Booking {
	var out []Booking
	for _, b := range s.bookings {
		if MatchBooking(f, b) {
			out = append(out, b)
		}
	}
	sort.Slice(out, func(i, j int) bool {
		if out[i].SessionID != out[j].SessionID {
			return out[i].SessionID < out[j].SessionID
		}
		return out[i].ID < out[j].ID
	})
	return out
}

// CountSessions returns the number of sessions.
func (s *Store) CountSessions() int { return len(s.sessions) }
