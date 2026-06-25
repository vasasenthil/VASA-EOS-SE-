package integration

import (
	"errors"
	"fmt"
	"log"
	"os"
	"sort"
	"sync"
)

// Co-curricular & Sports Competitions is an L6 student-development vertical: schools run sports meets and
// co-curricular contests on the Khelo India / school-games ladder (school → block → district → state → national),
// enter students, record podium results, and advance winners to the next level. It is durable, audited, and
// enforces three hard invariants server-side:
//   - UNIQUE ENTRY: a student can be entered at most once per competition (no double entry).
//   - PODIUM UNIQUENESS: each podium position (1st, 2nd, 3rd) is awarded at most once per competition (no two
//     gold medals).
//   - ADVANCEMENT GATE: only a podium finisher may be advanced to the next level, and a national-level result is
//     terminal (cannot be advanced further).
// Entries are embedded on the competition (like hostel residents). Downward-governance scoped. Synthetic SYN-
// ids only, never real PII.

// Competition status.
const (
	CompOpen   = "open"
	CompClosed = "closed"
)

// compLevels is the school-games ladder, lowest → highest; the index gives the advancement order.
var compLevels = []string{"school", "block", "district", "state", "national"}

func compLevelRank(level string) int {
	for i, l := range compLevels {
		if l == level {
			return i
		}
	}
	return -1
}

func validCompLevel(level string) bool { return compLevelRank(level) >= 0 }

func validDiscipline(d string) bool {
	switch d {
	case "athletics", "kabaddi", "kho_kho", "chess", "football", "volleyball", "debate", "quiz", "science_exhibition", "cultural":
		return true
	}
	return false
}

// CompEntry is one student's entry in a competition, with its podium position (0 = unplaced) and advancement flag.
type CompEntry struct {
	StudentID string `json:"student_id"`
	Class     string `json:"class"`
	Position  int    `json:"position"` // 0 unplaced; 1/2/3 podium
	Advanced  bool   `json:"advanced"`
	EnteredOn string `json:"entered_on"`
}

// Competition is one event with its entries.
type Competition struct {
	ID         string      `json:"id"`
	OrgUnit    string      `json:"org_unit"`
	Name       string      `json:"name"`
	Discipline string      `json:"discipline"`
	Level      string      `json:"level"` // school | block | district | state | national
	EventDate  string      `json:"event_date"`
	Entries    []CompEntry `json:"entries,omitempty"`
	Status     string      `json:"status"`
	CreatedOn  string      `json:"created_on"`
	UpdatedAt  string      `json:"updated_at"`
}

// Validate checks a competition's required fields.
func (c Competition) Validate() error {
	if c.ID == "" || c.OrgUnit == "" {
		return errors.New("competition: id and org_unit are required")
	}
	if c.Name == "" {
		return errors.New("competition: a name is required")
	}
	if !validDiscipline(c.Discipline) {
		return errors.New("competition: unknown discipline")
	}
	if !validCompLevel(c.Level) {
		return errors.New("competition: level must be school, block, district, state or national")
	}
	return nil
}

func (c Competition) entryIndex(studentID string) int {
	for i := range c.Entries {
		if c.Entries[i].StudentID == studentID {
			return i
		}
	}
	return -1
}

func (c Competition) positionHolder(position int) string {
	for _, e := range c.Entries {
		if e.Position == position {
			return e.StudentID
		}
	}
	return ""
}

// applyEnterCompetition enters a student — rejected if closed or already entered (unique entry).
func applyEnterCompetition(c Competition, studentID, class, now string) (Competition, error) {
	if c.Status != CompOpen {
		return Competition{}, errors.New("competition: entries are closed")
	}
	if studentID == "" {
		return Competition{}, errors.New("competition: a student_id is required")
	}
	if c.entryIndex(studentID) >= 0 {
		return Competition{}, fmt.Errorf("competition: %s is already entered in %s", studentID, c.ID)
	}
	c.Entries = append(c.Entries, CompEntry{StudentID: studentID, Class: class, EnteredOn: "2026-06-25"})
	c.UpdatedAt = now
	return c, nil
}

// applyRecordResult sets a student's podium position — rejected if closed, position out of 1..3, the student is
// not entered, or that position is already held by another student (podium uniqueness).
func applyRecordResult(c Competition, studentID string, position int, now string) (Competition, error) {
	if c.Status != CompOpen {
		return Competition{}, errors.New("competition: results are closed")
	}
	if position < 1 || position > 3 {
		return Competition{}, errors.New("competition: position must be 1, 2 or 3")
	}
	idx := c.entryIndex(studentID)
	if idx < 0 {
		return Competition{}, fmt.Errorf("competition: %s is not entered in %s", studentID, c.ID)
	}
	if holder := c.positionHolder(position); holder != "" && holder != studentID {
		return Competition{}, fmt.Errorf("competition: position %d is already held by %s", position, holder)
	}
	c.Entries[idx].Position = position
	c.UpdatedAt = now
	return c, nil
}

// applyAdvanceWinner marks a podium finisher advanced to the next level — rejected for a non-finisher or a
// national-level (terminal) result.
func applyAdvanceWinner(c Competition, studentID, now string) (Competition, error) {
	idx := c.entryIndex(studentID)
	if idx < 0 {
		return Competition{}, fmt.Errorf("competition: %s is not entered in %s", studentID, c.ID)
	}
	if p := c.Entries[idx].Position; p < 1 || p > 3 {
		return Competition{}, fmt.Errorf("competition: %s is not a podium finisher — only winners advance", studentID)
	}
	if compLevelRank(c.Level) >= compLevelRank("national") {
		return Competition{}, errors.New("competition: a national result is terminal — cannot advance further")
	}
	c.Entries[idx].Advanced = true
	c.UpdatedAt = now
	return c, nil
}

// applyCloseCompetition closes a competition (no further entries/results).
func applyCloseCompetition(c Competition, now string) (Competition, error) {
	c.Status = CompClosed
	c.UpdatedAt = now
	return c, nil
}

type compFilter struct{ OrgUnit, Level, Status string }

func matchComp(f compFilter, c Competition) bool {
	if f.OrgUnit != "" && c.OrgUnit != f.OrgUnit {
		return false
	}
	if f.Level != "" && c.Level != f.Level {
		return false
	}
	if f.Status != "" && c.Status != f.Status {
		return false
	}
	return true
}

// compStore is the persistence port. *memCompStore and *pgCompStore satisfy it.
type compStore interface {
	Upsert(Competition) (Competition, error)
	Get(id string) (Competition, bool)
	List(compFilter) []Competition
}

type memCompStore struct {
	mu sync.Mutex
	m  map[string]Competition
}

func newMemCompStore() *memCompStore { return &memCompStore{m: map[string]Competition{}} }

func (s *memCompStore) Upsert(c Competition) (Competition, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.m[c.ID] = c
	return c, nil
}

func (s *memCompStore) Get(id string) (Competition, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	c, ok := s.m[id]
	return c, ok
}

func (s *memCompStore) List(f compFilter) []Competition {
	s.mu.Lock()
	defer s.mu.Unlock()
	out := make([]Competition, 0, len(s.m))
	for _, c := range s.m {
		if matchComp(f, c) {
			out = append(out, c)
		}
	}
	return out
}

var (
	compOnce sync.Once
	compBack compStore
)

func compState() compStore {
	compOnce.Do(func() {
		if dsn := os.Getenv("DATABASE_URL"); dsn != "" {
			if pg, err := newPgCompStore(dsn); err == nil {
				compBack = pg
				log.Printf("competition: using durable PostgreSQL store (DATABASE_URL set)")
			} else {
				log.Printf("competition: DATABASE_URL set but PostgreSQL unavailable (%v); using in-memory", err)
				compBack = newMemCompStore()
			}
		} else {
			compBack = newMemCompStore()
		}
		seedCompetition(compBack)
	})
	return compBack
}

func compNow() string { return "2026-06-25T00:00:00Z" }

// CreateCompetition records a new competition (status open). Audited.
func (p *Platform) CreateCompetition(c Competition) (Competition, error) {
	c.Status = CompOpen
	c.Entries = nil
	if c.CreatedOn == "" {
		c.CreatedOn = "2026-06-25"
	}
	c.UpdatedAt = compNow()
	if err := c.Validate(); err != nil {
		p.appendAudit("sports-coordinator", "competition.create.denied", c.OrgUnit, "deny", err.Error())
		return Competition{}, err
	}
	out, err := compState().Upsert(c)
	if err != nil {
		return Competition{}, err
	}
	p.appendAudit("sports-coordinator", "competition.create", c.ID, "executed", fmt.Sprintf("%s (%s, %s)", c.Name, c.Discipline, c.Level))
	return out, nil
}

// EnterCompetition enters a student — rejecting a duplicate entry. Audited.
func (p *Platform) EnterCompetition(id, studentID, class string) (Competition, error) {
	cur, ok := compState().Get(id)
	if !ok {
		return Competition{}, errors.New("competition: not found")
	}
	out, err := applyEnterCompetition(cur, studentID, class, compNow())
	if err != nil {
		p.appendAudit("sports-coordinator", "competition.enter.denied", id, "deny", err.Error())
		return Competition{}, err
	}
	if _, err := compState().Upsert(out); err != nil {
		return Competition{}, err
	}
	p.appendAudit("sports-coordinator", "competition.enter", id, "executed", studentID)
	return out, nil
}

// RecordResult sets a podium position — rejecting an out-of-range or duplicate position. Audited.
func (p *Platform) RecordResult(id, studentID string, position int) (Competition, error) {
	cur, ok := compState().Get(id)
	if !ok {
		return Competition{}, errors.New("competition: not found")
	}
	out, err := applyRecordResult(cur, studentID, position, compNow())
	if err != nil {
		p.appendAudit("sports-coordinator", "competition.result.denied", id, "deny", err.Error())
		return Competition{}, err
	}
	if _, err := compState().Upsert(out); err != nil {
		return Competition{}, err
	}
	p.appendAudit("sports-coordinator", "competition.result", id, "executed", fmt.Sprintf("%s → #%d", studentID, position))
	return out, nil
}

// AdvanceWinner advances a podium finisher to the next level — rejecting a non-finisher or a terminal result. Audited.
func (p *Platform) AdvanceWinner(id, studentID string) (Competition, error) {
	cur, ok := compState().Get(id)
	if !ok {
		return Competition{}, errors.New("competition: not found")
	}
	out, err := applyAdvanceWinner(cur, studentID, compNow())
	if err != nil {
		p.appendAudit("sports-coordinator", "competition.advance.denied", id, "deny", err.Error())
		return Competition{}, err
	}
	if _, err := compState().Upsert(out); err != nil {
		return Competition{}, err
	}
	p.appendAudit("sports-coordinator", "competition.advance", id, "executed", studentID)
	return out, nil
}

// CloseCompetition closes a competition. Audited.
func (p *Platform) CloseCompetition(id string) (Competition, error) {
	cur, ok := compState().Get(id)
	if !ok {
		return Competition{}, errors.New("competition: not found")
	}
	out, err := applyCloseCompetition(cur, compNow())
	if err != nil {
		p.appendAudit("sports-coordinator", "competition.close.denied", id, "deny", err.Error())
		return Competition{}, err
	}
	if _, err := compState().Upsert(out); err != nil {
		return Competition{}, err
	}
	p.appendAudit("sports-coordinator", "competition.close", id, "executed", "closed")
	return out, nil
}

// CompetitionRecord returns a single competition by id.
func (p *Platform) CompetitionRecord(id string) (Competition, bool) { return compState().Get(id) }

// CompetitionDashboard is the jurisdiction-scoped picture: competitions by level/status, total entries, podium
// finishers, advanced count and the open worklist. Downward-governance scoped.
type CompetitionDashboard struct {
	Scope     string         `json:"scope"`
	Total     int            `json:"total"`
	ByLevel   map[string]int `json:"by_level"`
	ByStatus  map[string]int `json:"by_status"`
	Entries   int            `json:"entries"`
	Podium    int            `json:"podium"`
	Advanced  int            `json:"advanced"`
	OpenMeets []Competition  `json:"open_meets,omitempty"`
	Synthetic bool           `json:"synthetic"`
}

// CompetitionDashboard rolls up competitions across the schools a tenant node governs (fail-closed for others).
func (p *Platform) CompetitionDashboard(scopeOrg string) CompetitionDashboard {
	d := CompetitionDashboard{Scope: scopeOrg, ByLevel: map[string]int{}, ByStatus: map[string]int{}, Synthetic: true}
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return d
	}
	for _, c := range compState().List(compFilter{}) {
		if !h.Governs(scopeOrg, c.OrgUnit) {
			continue
		}
		d.Total++
		d.ByLevel[c.Level]++
		d.ByStatus[c.Status]++
		for _, e := range c.Entries {
			d.Entries++
			if e.Position >= 1 && e.Position <= 3 {
				d.Podium++
			}
			if e.Advanced {
				d.Advanced++
			}
		}
		if c.Status == CompOpen {
			d.OpenMeets = append(d.OpenMeets, c)
		}
	}
	sort.Slice(d.OpenMeets, func(i, j int) bool { return d.OpenMeets[i].ID < d.OpenMeets[j].ID })
	return d
}

// ScopedCompetitions lists competitions a tenant node governs (optionally filtered by status).
func (p *Platform) ScopedCompetitions(scopeOrg, status string) []Competition {
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return nil
	}
	var out []Competition
	for _, c := range compState().List(compFilter{Status: status}) {
		if h.Governs(scopeOrg, c.OrgUnit) {
			out = append(out, c)
		}
	}
	return out
}

// seedCompetition plants competitions across schools over more than one district: an athletics meet with a full
// podium (one winner advanced to block), a chess open with entries awaiting results, and a closed debate.
// Synthetic SYN- ids only.
func seedCompetition(s compStore) {
	schools := pilotSchools(4)
	if len(schools) == 0 {
		if only := tenancyLeafUnder(pilotDistrict()); only != "" {
			schools = []string{only}
		} else {
			return
		}
	}
	for si, school := range schools {
		tag := schoolTag(si)

		// Athletics 100m — full podium, gold advanced to block level.
		ath := Competition{
			ID: fmt.Sprintf("COMP-%s-ATH", tag), OrgUnit: school, Name: "100m Sprint", Discipline: "athletics",
			Level: "school", EventDate: "2026-07-10", Status: CompOpen, CreatedOn: "2026-06-15", UpdatedAt: compNow(),
		}
		for i := 0; i < 5; i++ {
			ath, _ = applyEnterCompetition(ath, fmt.Sprintf("SYN-S-%s-A%02d", tag, i+1), "Grade 9", compNow())
		}
		ath, _ = applyRecordResult(ath, fmt.Sprintf("SYN-S-%s-A01", tag), 1, compNow())
		ath, _ = applyRecordResult(ath, fmt.Sprintf("SYN-S-%s-A02", tag), 2, compNow())
		ath, _ = applyRecordResult(ath, fmt.Sprintf("SYN-S-%s-A03", tag), 3, compNow())
		ath, _ = applyAdvanceWinner(ath, fmt.Sprintf("SYN-S-%s-A01", tag), compNow())
		s.Upsert(ath)

		// Chess open — entries, no results yet.
		chess := Competition{
			ID: fmt.Sprintf("COMP-%s-CHESS", tag), OrgUnit: school, Name: "Chess Open", Discipline: "chess",
			Level: "school", EventDate: "2026-07-20", Status: CompOpen, CreatedOn: "2026-06-18", UpdatedAt: compNow(),
		}
		for i := 0; i < 4; i++ {
			chess, _ = applyEnterCompetition(chess, fmt.Sprintf("SYN-S-%s-C%02d", tag, i+1), "Grade 8", compNow())
		}
		s.Upsert(chess)

		// Debate — completed and closed.
		deb := Competition{
			ID: fmt.Sprintf("COMP-%s-DEB", tag), OrgUnit: school, Name: "Inter-class Debate", Discipline: "debate",
			Level: "school", EventDate: "2026-06-05", Status: CompOpen, CreatedOn: "2026-05-25", UpdatedAt: compNow(),
		}
		for i := 0; i < 3; i++ {
			deb, _ = applyEnterCompetition(deb, fmt.Sprintf("SYN-S-%s-D%02d", tag, i+1), "Grade 10", compNow())
		}
		deb, _ = applyRecordResult(deb, fmt.Sprintf("SYN-S-%s-D01", tag), 1, compNow())
		deb, _ = applyCloseCompetition(deb, compNow())
		s.Upsert(deb)
	}
}
