package integration

import (
	"fmt"
	"log"
	"os"
	"sync"

	"github.com/vasa-eos-se-tn/platform/ptm"
)

// Parent-Teacher Meeting is an L6 capacity-checked booking vertical: it schedules PTM sessions and books
// guardians into their slots, enforcing that a session is never overbooked and that a guardian never
// double-books, then tracks attendance (booked → attended | no_show). Durable to PostgreSQL.
var (
	ptmOnce sync.Once
	ptmBack ptmStore
)

// ptmStore is the persistence port (sessions + bookings).
type ptmStore interface {
	UpsertSession(ptm.Session) (ptm.Session, error)
	GetSession(id string) (ptm.Session, bool)
	Book(ptm.Booking) (ptm.Booking, error)
	MarkAttended(id string) (ptm.Booking, error)
	MarkNoShow(id string) (ptm.Booking, error)
	CancelBooking(id string) (ptm.Booking, error)
	ListSessions(ptm.SessionFilter) []ptm.Session
	ListBookings(ptm.BookingFilter) []ptm.Booking
}

func ptmState() ptmStore {
	ptmOnce.Do(func() {
		if dsn := os.Getenv("DATABASE_URL"); dsn != "" {
			if pg, err := newPgPtmStore(dsn); err == nil {
				ptmBack = pg
				log.Printf("ptm: using durable PostgreSQL store (DATABASE_URL set)")
			} else {
				log.Printf("ptm: DATABASE_URL set but PostgreSQL unavailable (%v); using in-memory", err)
				ptmBack = ptm.NewStore()
			}
		} else {
			ptmBack = ptm.NewStore()
		}
		seedPTM(ptmBack)
	})
	return ptmBack
}

// seedPTM plants a Term-1 PTM at a real Chennai school: a session with 8 slots, mostly booked, with attendance
// marked for the past meeting (some attended, some no-show) so the turnout analytics have signal. Synthetic ids.
func seedPTM(s ptmStore) {
	// Run a PTM session at several schools over more than one district so the turnout roll-up spans the estate
	// (bottom-up) while each school scopes to its own session (top-down).
	schools := pilotSchools(4)
	if len(schools) == 0 {
		if only := tenancyLeafUnder(pilotDistrict()); only != "" {
			schools = []string{only}
		} else {
			return
		}
	}
	outcomes := []struct {
		n    int
		mark string // attend | noshow | ""
	}{
		{1, "attend"}, {2, "attend"}, {3, "attend"}, {4, "attend"}, {5, "noshow"}, {6, ""},
	}
	for si, school := range schools {
		tag := schoolTag(si) // "CHN" for school 0 (preserves existing ids), "S<n>" otherwise
		sid := fmt.Sprintf("PTM-%s-T1", tag)
		s.UpsertSession(ptm.Session{ID: sid, OrgUnit: school, Title: "Term 1 Parent-Teacher Meeting", Date: "2026-06-14", Slots: 8, Status: ptm.Scheduled})
		// six guardians booked; four attended, one no-show, one still booked.
		for _, o := range outcomes {
			id := fmt.Sprintf("PTMB-%s-%02d", tag, o.n)
			student := fmt.Sprintf("SYN-S-%03d", o.n)
			if si > 0 {
				student = fmt.Sprintf("%s-%s", student, tag)
			}
			if _, err := s.Book(ptm.Booking{ID: id, SessionID: sid, OrgUnit: school, StudentID: student, Guardian: "Guardian of " + student, Status: ptm.Booked, Slot: fmt.Sprintf("%02d:00", 9+o.n)}); err != nil {
				continue
			}
			switch o.mark {
			case "attend":
				s.MarkAttended(id)
			case "noshow":
				s.MarkNoShow(id)
			}
		}
	}
}

// ScheduledPTM schedules (or updates) a PTM session. Audited.
func (p *Platform) SchedulePTM(sess ptm.Session) (ptm.Session, error) {
	out, err := ptmState().UpsertSession(sess)
	if err != nil {
		p.appendAudit("class-teacher", "ptm.session.denied", sess.ID, "deny", err.Error())
		return ptm.Session{}, err
	}
	p.appendAudit("class-teacher", "ptm.session", sess.ID, sess.Status, fmt.Sprintf("%s %s · %d slots", sess.Title, sess.Date, sess.Slots))
	return out, nil
}

// BookPTM books a guardian into a session slot (rejecting an overbooking or a double-booking). Audited.
func (p *Platform) BookPTM(b ptm.Booking) (ptm.Booking, error) {
	out, err := ptmState().Book(b)
	if err != nil {
		p.appendAudit("guardian", "ptm.book.denied", b.SessionID, "deny", err.Error())
		return ptm.Booking{}, err
	}
	p.appendAudit("guardian", "ptm.book", b.ID, "executed", fmt.Sprintf("%s → %s", b.StudentID, b.SessionID))
	return out, nil
}

// MarkPTMAttendance records whether a booked guardian attended (attend) or did not (noshow), or cancels a slot
// (cancel). Audited.
func (p *Platform) MarkPTMAttendance(id, action string) (ptm.Booking, error) {
	var out ptm.Booking
	var err error
	switch action {
	case "attend":
		out, err = ptmState().MarkAttended(id)
	case "noshow":
		out, err = ptmState().MarkNoShow(id)
	case "cancel":
		out, err = ptmState().CancelBooking(id)
	default:
		err = fmt.Errorf("ptm: unknown attendance action %q", action)
	}
	if err != nil {
		p.appendAudit("class-teacher", "ptm.attendance."+action+".denied", id, "deny", err.Error())
		return ptm.Booking{}, err
	}
	p.appendAudit("class-teacher", "ptm.attendance."+action, id, out.Status, "")
	return out, nil
}

// SessionBookings returns the bookings for a PTM session (the attendance sheet).
func (p *Platform) SessionBookings(sessionID string) []ptm.Booking {
	return ptmState().ListBookings(ptm.BookingFilter{SessionID: sessionID})
}

// PTMSessionRollup is one session's booking + turnout line in the dashboard.
type PTMSessionRollup struct {
	SessionID  string  `json:"session_id"`
	Title      string  `json:"title"`
	Date       string  `json:"date"`
	Slots      int     `json:"slots"`
	Booked     int     `json:"booked"`
	Attended   int     `json:"attended"`
	NoShow     int     `json:"no_show"`
	FillPct    float64 `json:"fill_pct"`
	TurnoutPct float64 `json:"turnout_pct"`
}

// PTMDashboard is the jurisdiction-scoped parent-engagement picture: PTM sessions, their fill (booked vs slots)
// and turnout (attended vs occupied), and a low-turnout roster. Downward-governance scoped.
type PTMDashboard struct {
	Scope       string             `json:"scope"`
	Sessions    int                `json:"sessions"`
	Slots       int                `json:"total_slots"`
	Occupied    int                `json:"occupied"`
	Attended    int                `json:"attended"`
	TurnoutPct  float64            `json:"turnout_pct"`
	SessionRoll []PTMSessionRollup `json:"sessions_rollup,omitempty"`
	LowTurnout  []PTMSessionRollup `json:"low_turnout,omitempty"`
	Synthetic   bool               `json:"synthetic"`
}

// lowTurnoutThreshold is the turnout percentage below which a completed session is flagged for follow-up.
const lowTurnoutThreshold = 60

// PTMDashboard rolls up parent-engagement for the schools a tenant node governs.
func (p *Platform) PTMDashboard(scopeOrg string) PTMDashboard {
	d := PTMDashboard{Scope: scopeOrg, Synthetic: true}
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return d
	}
	bookings := ptmState().ListBookings(ptm.BookingFilter{})
	for _, sess := range ptmState().ListSessions(ptm.SessionFilter{}) {
		if !h.Governs(scopeOrg, sess.OrgUnit) {
			continue
		}
		roll := PTMSessionRollup{SessionID: sess.ID, Title: sess.Title, Date: sess.Date, Slots: sess.Slots}
		var occupied int
		for _, b := range bookings {
			if b.SessionID != sess.ID {
				continue
			}
			switch b.Status {
			case ptm.Booked:
				roll.Booked++
				occupied++
			case ptm.Attended:
				roll.Attended++
				occupied++
			case ptm.NoShow:
				roll.NoShow++
				occupied++
			}
		}
		if sess.Slots > 0 {
			roll.FillPct = float64(occupied) * 100 / float64(sess.Slots)
		}
		if occupied > 0 {
			roll.TurnoutPct = float64(roll.Attended) * 100 / float64(occupied)
		}
		d.Sessions++
		d.Slots += sess.Slots
		d.Occupied += occupied
		d.Attended += roll.Attended
		d.SessionRoll = append(d.SessionRoll, roll)
		// flag low turnout only once a session has been worked (some attendance marked).
		if (roll.Attended+roll.NoShow) > 0 && roll.TurnoutPct < lowTurnoutThreshold {
			d.LowTurnout = append(d.LowTurnout, roll)
		}
	}
	if d.Occupied > 0 {
		d.TurnoutPct = float64(d.Attended) * 100 / float64(d.Occupied)
	}
	return d
}
