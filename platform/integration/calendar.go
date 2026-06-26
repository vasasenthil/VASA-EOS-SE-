package integration

import (
	"errors"
	"fmt"
	"log"
	"os"
	"sync"

	"github.com/vasa-eos-se-tn/platform/calendar"
	"github.com/vasa-eos-se-tn/platform/govtiers"
)

// The Events & Academic Calendar is a per-platform L6 service. Entries plan the academic year (terms, exams,
// holidays, PTMs, events), each bound to the org unit it applies to, and move through a DYNAMIC multi-level
// approval chain whose depth is derived from the entry's TYPE and the TENANCY LEVEL of its org unit — a
// state-wide board examination escalates G4→G3→G2→G1; a school PTM needs one signature; a school event none.
var (
	calOnce sync.Once
	calBack calStore
)

const academicYear = "2026-2027"

// calendarState returns the calendar persistence adapter. When DATABASE_URL is set it is the DURABLE
// PostgreSQL store (entries survive restarts); otherwise it is the in-memory store (credential-free demo).
// Seeding is idempotent: on a populated database the seed inserts collide on primary key and are ignored, so
// existing data is preserved across restarts.
func calendarState() calStore {
	calOnce.Do(func() {
		if dsn := os.Getenv("DATABASE_URL"); dsn != "" {
			if pg, err := newPgCalendarStore(dsn); err == nil {
				calBack = pg
				log.Printf("calendar: using durable PostgreSQL store (DATABASE_URL set)")
			} else {
				log.Printf("calendar: DATABASE_URL set but PostgreSQL unavailable (%v); refusing to seed — fix the DB", err)
				calBack = calendar.NewStore()
			}
		} else {
			calBack = calendar.NewStore()
		}
		seedCalendar(calBack)
	})
	return calBack
}

// chainFor sizes the approval chain DYNAMICALLY from the entry type and the tenancy level the entry applies to,
// then materialises each governance tier (G-code → approver role + required scope) from the L11 register. The
// higher the stakes and the wider the jurisdiction, the more levels of human approval are required.
func (p *Platform) chainFor(etype, orgUnit string) []calendar.ApprovalStep {
	level := 6 // default to school leaf if the node is unknown
	if h, err := tenancyHierarchy(); err == nil && h != nil {
		if n, ok := h.Get(orgUnit); ok {
			level = n.Level
		}
	}
	var codes []string
	switch etype {
	case calendar.Exam:
		switch {
		case level <= 2: // state / secretariat / directorate — a board / state examination
			codes = []string{"G4", "G3", "G2", "G1"}
		case level == 3: // district common examination
			codes = []string{"G4", "G3", "G2"}
		default: // block / cluster / school internal examination
			codes = []string{"G4", "G3"}
		}
	case calendar.Holiday:
		if level <= 3 {
			codes = []string{"G4", "G3", "G2"} // declaring holidays widely is sensitive
		} else {
			codes = []string{"G4", "G3"}
		}
	case calendar.Term:
		switch {
		case level <= 2:
			codes = []string{"G4", "G3", "G2"}
		case level == 3:
			codes = []string{"G4", "G3"}
		default:
			codes = []string{"G4"}
		}
	case calendar.PTM:
		if level >= 6 {
			codes = []string{"G4"} // a school PTM needs a single field-officer signature
		} else {
			codes = []string{"G4", "G3"}
		}
	case calendar.Event:
		if level >= 6 {
			codes = nil // a school-local event is within the head teacher's authority — auto-publishes
		} else {
			codes = []string{"G4"}
		}
	default:
		codes = []string{"G4"}
	}
	steps := make([]calendar.ApprovalStep, 0, len(codes))
	for _, c := range codes {
		if t, ok := govtiers.TierFor(c); ok {
			steps = append(steps, calendar.ApprovalStep{Tier: t.Code, ApproverRole: t.ApproverRole, RequiredScope: t.RequiredScope})
		}
	}
	return steps
}

// CalendarDraft is the input for adding a new academic-calendar entry.
type CalendarDraft struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Type        string `json:"type"`
	StartDate   string `json:"start_date"`
	EndDate     string `json:"end_date"`
	OrgUnit     string `json:"org_unit"`
	Description string `json:"description,omitempty"`
}

// AddCalendarEntry creates a new draft entry (CRUD create). Audited.
func (p *Platform) AddCalendarEntry(in CalendarDraft) (calendar.Entry, error) {
	s := calendarState()
	e, err := s.Create(calendar.Entry{
		ID: in.ID, Title: in.Title, Type: in.Type, StartDate: in.StartDate, EndDate: in.EndDate,
		OrgUnit: in.OrgUnit, AcademicYear: academicYear, Description: in.Description, Synthetic: true,
	})
	if err != nil {
		return calendar.Entry{}, err
	}
	p.appendAudit("calendar", "calendar.create", e.ID, "executed", e.Type+" @ "+e.OrgUnit)
	return e, nil
}

// SubmitCalendarEntry routes a draft into its dynamically-sized approval chain and audits the planned route.
func (p *Platform) SubmitCalendarEntry(id string) (calendar.Entry, error) {
	s := calendarState()
	e, ok := s.Get(id)
	if !ok {
		return calendar.Entry{}, errors.New("calendar: not found")
	}
	chain := p.chainFor(e.Type, e.OrgUnit)
	out, err := s.Submit(id, chain)
	if err != nil {
		return calendar.Entry{}, err
	}
	route := "auto-publish"
	if len(chain) > 0 {
		route = ""
		for i, st := range chain {
			if i > 0 {
				route += "→"
			}
			route += st.Tier
		}
	}
	p.appendAudit("calendar", "calendar.submit", id, "executed", fmt.Sprintf("%s route=%s", out.Status, route))
	return out, nil
}

// DecideCalendarEntry applies an approve/reject decision at the entry's current approval level (multi-level,
// fail-closed: the actor must hold the level's role + scope). Audited.
func (p *Platform) DecideCalendarEntry(id string, approve bool, actorID, actorRole string, scopes []string, note string) (calendar.Entry, error) {
	s := calendarState()
	out, err := s.Act(id, approve, actorID, actorRole, scopes, note)
	effect := "approved"
	if !approve {
		effect = "rejected"
	}
	if err != nil {
		p.appendAudit("role:"+actorRole, "calendar.decide.denied", id, "deny", err.Error())
		return calendar.Entry{}, err
	}
	p.appendAudit("role:"+actorRole, "calendar.decide", id, effect, "status="+out.Status)
	return out, nil
}

// scopedCalendarEntries returns the academic-calendar entries a tenant node governs (downward governance),
// filtered by type/year and kept in date order.
func (p *Platform) scopedCalendarEntries(scopeOrg, etype, year string) []calendar.Entry {
	s := calendarState()
	listed := s.List(calendar.Filter{Type: etype, Year: year})
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return nil
	}
	var out []calendar.Entry
	for _, e := range listed {
		if h.Governs(scopeOrg, e.OrgUnit) {
			out = append(out, e)
		}
	}
	return out
}

// CalendarEntries is the scoped, filtered, date-ordered listing for an officer's jurisdiction.
func (p *Platform) CalendarEntries(scopeOrg, etype, year string) []calendar.Entry {
	return p.scopedCalendarEntries(scopeOrg, etype, year)
}

// CalendarDashboard is the realtime, jurisdiction-scoped operating picture of the academic calendar: totals by
// type and status, the pending-approval backlog, the role's own approval inbox, and the upcoming published
// feed — everything a head teacher / BEO / DEO / Director needs to run the year at their level.
type CalendarDashboard struct {
	Scope            string           `json:"scope"`
	AcademicYear     string           `json:"academic_year"`
	Total            int              `json:"total"`
	ByType           map[string]int   `json:"by_type"`
	ByStatus         map[string]int   `json:"by_status"`
	PendingApprovals int              `json:"pending_approvals"`
	Published        int              `json:"published"`
	MyInbox          []calendar.Entry `json:"my_inbox"` // entries awaiting THIS role at their current level
	Upcoming         []calendar.Entry `json:"upcoming"`
	Synthetic        bool             `json:"synthetic"`
}

// CalendarDashboard assembles the scoped dashboard. `asRole` is the viewer's role (drives the approval inbox);
// `from` (YYYY-MM-DD) is the reference date for the upcoming feed.
func (p *Platform) CalendarDashboard(scopeOrg, asRole, from string) CalendarDashboard {
	entries := p.scopedCalendarEntries(scopeOrg, "", "")
	sum := calendar.Summarise(entries, from, 8)
	return CalendarDashboard{
		Scope: scopeOrg, AcademicYear: academicYear, Total: sum.Total, ByType: sum.ByType,
		ByStatus: sum.ByStatus, PendingApprovals: sum.PendingApprovals, Published: sum.Published,
		MyInbox: calendar.PendingFor(entries, asRole), Upcoming: sum.Upcoming, Synthetic: true,
	}
}

// seedCalendar plants a representative academic year (AY 2026-2027) anchored to REAL org units: state-wide
// terms/holidays/board exams under TN, a district common exam under Chennai, and school PTM/events under a real
// Chennai school. State fixtures are seeded already-published (the ratified annual calendar); the board exam is
// left in its live multi-level approval so the dashboard shows real pending work. Synthetic, illustrative.
func seedCalendar(s calStore) {
	pub := func(id, title, typ, start, end, org string) {
		s.Create(calendar.Entry{ID: id, Title: title, Type: typ, StartDate: start, EndDate: end, OrgUnit: org, AcademicYear: academicYear, Status: calendar.Approved, Synthetic: true})
	}
	draft := func(id, title, typ, start, end, org string) {
		s.Create(calendar.Entry{ID: id, Title: title, Type: typ, StartDate: start, EndDate: end, OrgUnit: org, AcademicYear: academicYear, Synthetic: true})
	}
	// ── ratified state-wide fixtures (published) ──
	pub("CAL-TERM-1", "Term I begins", calendar.Term, "2026-06-01", "2026-06-01", "TN")
	pub("CAL-TERM-2", "Term II begins", calendar.Term, "2026-09-21", "2026-09-21", "TN")
	pub("CAL-TERM-3", "Term III begins", calendar.Term, "2027-01-02", "2027-01-02", "TN")
	pub("CAL-HOL-PONGAL", "Pongal vacation", calendar.Holiday, "2027-01-14", "2027-01-17", "TN")
	pub("CAL-HOL-INDEP", "Independence Day", calendar.Holiday, "2026-08-15", "2026-08-15", "TN")
	pub("CAL-HOL-SUMMER", "Summer vacation", calendar.Holiday, "2027-04-25", "2027-05-31", "TN")
	// ── live board examination, in its full G4→G3→G2→G1 approval ──
	draft("CAL-EXAM-SSLC", "SSLC (Class 10) public examination", calendar.Exam, "2027-03-26", "2027-04-13", "TN")

	// district common quarterly examination — anchored to Chennai (will route G4→G3→G2 when submitted).
	district := "TN-DIST-Chennai"
	draft("CAL-EXAM-CHN-Q", "Chennai district quarterly common examination", calendar.Exam, "2026-09-07", "2026-09-12", district)

	// school-level entries anchored to a real Chennai school.
	if sc := tenancyLeafUnder(district); sc != "" {
		pub("CAL-PTM-1", "Term I parent-teacher meeting", calendar.PTM, "2026-07-12", "2026-07-12", sc)
		draft("CAL-EVENT-ANNUAL", "School annual day", calendar.Event, "2026-12-19", "2026-12-19", sc)
		draft("CAL-EVENT-SPORTS", "Sports day", calendar.Event, "2026-11-14", "2026-11-14", sc)
	}
}

// tenancyLeafUnder returns the first T6 school UDISE governed by a node (or "" if none / unavailable).
func tenancyLeafUnder(org string) string {
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return ""
	}
	if leaves := h.LeavesUnder(org, 6); len(leaves) > 0 {
		return leaves[0]
	}
	return ""
}

// pilotDistrict is the tenancy district the demo seeds plant against. It defaults to Chennai but is overridable
// via the PILOT_DISTRICT env var (e.g. "TN-DIST-Madurai") so a single-district pilot deployment can be pointed
// at the district that is actually going live, without code changes.
func pilotDistrict() string {
	if d := os.Getenv("PILOT_DISTRICT"); d != "" {
		return d
	}
	return "TN-DIST-Chennai"
}

// pilotDistricts returns the districts the multi-school seeds spread across, so district→state roll-ups span
// more than a single node. The primary pilot district plus one sibling (overridable via PILOT_DISTRICT_2).
func pilotDistricts() []string {
	primary := pilotDistrict()
	second := os.Getenv("PILOT_DISTRICT_2")
	if second == "" {
		second = "TN-DIST-Coimbatore"
	}
	if second == primary {
		second = "TN-DIST-Madurai"
	}
	return []string{primary, second}
}

// pilotSchools returns up to n distinct T6 school UDISEs drawn from the pilot districts in order, so the
// operational seeds populate several schools across more than one district. This is what turns the downward
// scope + upward roll-up machinery from a single-school demo into a genuine multi-node picture: a district or
// state dashboard then aggregates real data from many schools, while each school still sees only its own.
// schoolTag returns the id fragment a per-school seed uses for school index si. School 0 keeps the original
// "CHN" tag so all existing ids (and the tests/proofs that reference them) are unchanged; later schools get a
// distinct "S<n>" tag so their seeded ids stay unique across the multi-school estate.
func schoolTag(si int) string {
	if si == 0 {
		return "CHN"
	}
	return fmt.Sprintf("S%d", si)
}

func pilotSchools(n int) []string {
	h, err := tenancyHierarchy()
	if err != nil || h == nil || n <= 0 {
		return nil
	}
	// gather each district's school leaves, then round-robin across districts so the selection genuinely spans
	// more than one district (rather than exhausting the first district's leaves before reaching the next).
	dists := pilotDistricts()
	leaves := make([][]string, len(dists))
	maxLen := 0
	for i, dist := range dists {
		leaves[i] = h.LeavesUnder(dist, 6)
		if len(leaves[i]) > maxLen {
			maxLen = len(leaves[i])
		}
	}
	out := make([]string, 0, n)
	seen := map[string]bool{}
	for col := 0; col < maxLen && len(out) < n; col++ {
		for d := 0; d < len(dists) && len(out) < n; d++ {
			if col < len(leaves[d]) && !seen[leaves[d][col]] {
				seen[leaves[d][col]] = true
				out = append(out, leaves[d][col])
			}
		}
	}
	return out
}
