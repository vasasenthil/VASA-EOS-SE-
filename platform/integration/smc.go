package integration

import (
	"errors"
	"fmt"
	"log"
	"os"
	"sync"
)

// SMC (School Management Committee) Meetings & Resolutions is an L4 governance vertical realising RTE §21–22:
// every school constitutes an SMC of which THREE-FOURTHS shall be parents/guardians (RTE §21(2)), and the SMC
// meets to monitor the school and pass resolutions / school-development decisions. This module makes that durable
// with two hard invariants enforced server-side:
//   - COMPOSITION (RTE §21(2)): a committee cannot be constituted unless parent_members ≥ ceil(0.75 × total).
//   - QUORUM: a meeting can only be CONVENED — and resolutions only passed — when attendance meets a majority
//     quorum (present > total/2). Resolutions cannot be passed on a meeting that never reached quorum.
// Resolutions are embedded action items (subject + owner + due) with an open→done lifecycle. Durable to
// PostgreSQL; downward-governance scoped. Synthetic ids only, never real PII.

// SMC meeting status.
const (
	SMCScheduled = "scheduled"
	SMCConvened  = "convened"
	SMCClosed    = "closed"
)

// Resolution action-item status.
const (
	ResolutionOpen = "open"
	ResolutionDone = "done"
)

// Resolution is a single decision/action item passed in a convened SMC meeting.
type Resolution struct {
	ID      string `json:"id"`
	Subject string `json:"subject"`
	Owner   string `json:"owner"` // who is accountable (synthetic id / role)
	DueDate string `json:"due_date"`
	Status  string `json:"status"` // open | done
}

// SMCMeeting is one convened (or scheduled) meeting of a school's management committee.
type SMCMeeting struct {
	ID            string       `json:"id"`
	OrgUnit       string       `json:"org_unit"` // the school (T6 tenancy node)
	Title         string       `json:"title"`
	ScheduledDate string       `json:"scheduled_date"`
	TotalMembers  int          `json:"total_members"`  // sanctioned SMC strength
	ParentMembers int          `json:"parent_members"` // ≥ 75% of total (RTE §21(2))
	PresentCount  int          `json:"present_count"`  // members who attended (set at convene)
	Status        string       `json:"status"`
	Resolutions   []Resolution `json:"resolutions,omitempty"`
	CreatedOn     string       `json:"created_on"`
	UpdatedAt     string       `json:"updated_at"`
}

// quorumOf is the majority quorum for a committee of n members (more than half).
func quorumOf(total int) int { return total/2 + 1 }

// parentFloor is the minimum number of parent members (three-fourths, rounded up) for a committee of n members.
func parentFloor(total int) int { return (3*total + 3) / 4 }

// Validate checks an SMC meeting's required fields and the RTE three-fourths-parents composition rule.
func (m SMCMeeting) Validate() error {
	if m.ID == "" || m.OrgUnit == "" {
		return errors.New("smc: id and org_unit are required")
	}
	if m.Title == "" {
		return errors.New("smc: a title is required")
	}
	if m.ScheduledDate == "" {
		return errors.New("smc: a scheduled date is required")
	}
	if m.TotalMembers < 1 {
		return errors.New("smc: total_members must be at least 1")
	}
	if m.ParentMembers < 0 || m.ParentMembers > m.TotalMembers {
		return errors.New("smc: parent_members must be between 0 and total_members")
	}
	if m.ParentMembers < parentFloor(m.TotalMembers) {
		return fmt.Errorf("smc: RTE §21(2) requires at least three-fourths parents — need %d parent member(s) of %d, got %d",
			parentFloor(m.TotalMembers), m.TotalMembers, m.ParentMembers)
	}
	return nil
}

// applySMCConvene convenes a scheduled meeting — requires a majority quorum to be present.
func applySMCConvene(m SMCMeeting, present int, now string) (SMCMeeting, error) {
	if m.Status != SMCScheduled {
		return SMCMeeting{}, fmt.Errorf("smc: only a scheduled meeting can be convened (is %s)", m.Status)
	}
	if present < 0 || present > m.TotalMembers {
		return SMCMeeting{}, errors.New("smc: present_count must be between 0 and total_members")
	}
	if present < quorumOf(m.TotalMembers) {
		return SMCMeeting{}, fmt.Errorf("smc: quorum not met — need %d of %d present, got %d",
			quorumOf(m.TotalMembers), m.TotalMembers, present)
	}
	m.PresentCount = present
	m.Status = SMCConvened
	m.UpdatedAt = now
	return m, nil
}

// applySMCResolve passes a resolution — only on a convened (quorate) meeting.
func applySMCResolve(m SMCMeeting, r Resolution, now string) (SMCMeeting, error) {
	if m.Status != SMCConvened {
		return SMCMeeting{}, errors.New("smc: resolutions can only be passed on a convened (quorate) meeting")
	}
	if r.Subject == "" {
		return SMCMeeting{}, errors.New("smc: a resolution subject is required")
	}
	r.Status = ResolutionOpen
	if r.ID == "" {
		r.ID = fmt.Sprintf("%s-R%02d", m.ID, len(m.Resolutions)+1)
	}
	m.Resolutions = append(m.Resolutions, r)
	m.UpdatedAt = now
	return m, nil
}

// applySMCComplete marks an open resolution done.
func applySMCComplete(m SMCMeeting, resolutionID, now string) (SMCMeeting, error) {
	for i := range m.Resolutions {
		if m.Resolutions[i].ID == resolutionID {
			if m.Resolutions[i].Status == ResolutionDone {
				return SMCMeeting{}, errors.New("smc: resolution already completed")
			}
			m.Resolutions[i].Status = ResolutionDone
			m.UpdatedAt = now
			return m, nil
		}
	}
	return SMCMeeting{}, errors.New("smc: resolution not found")
}

// applySMCClose closes a convened meeting (no further resolutions).
func applySMCClose(m SMCMeeting, now string) (SMCMeeting, error) {
	if m.Status != SMCConvened {
		return SMCMeeting{}, errors.New("smc: only a convened meeting can be closed")
	}
	m.Status = SMCClosed
	m.UpdatedAt = now
	return m, nil
}

type smcFilter struct{ OrgUnit, Status string }

func matchSMC(f smcFilter, m SMCMeeting) bool {
	if f.OrgUnit != "" && m.OrgUnit != f.OrgUnit {
		return false
	}
	if f.Status != "" && m.Status != f.Status {
		return false
	}
	return true
}

// smcStore is the persistence port. *memSMCStore and *pgSMCStore satisfy it.
type smcStore interface {
	Upsert(SMCMeeting) (SMCMeeting, error)
	Get(id string) (SMCMeeting, bool)
	List(smcFilter) []SMCMeeting
}

type memSMCStore struct {
	mu sync.Mutex
	m  map[string]SMCMeeting
}

func newMemSMCStore() *memSMCStore { return &memSMCStore{m: map[string]SMCMeeting{}} }

func (s *memSMCStore) Upsert(m SMCMeeting) (SMCMeeting, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.m[m.ID] = m
	return m, nil
}

func (s *memSMCStore) Get(id string) (SMCMeeting, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	m, ok := s.m[id]
	return m, ok
}

func (s *memSMCStore) List(f smcFilter) []SMCMeeting {
	s.mu.Lock()
	defer s.mu.Unlock()
	out := make([]SMCMeeting, 0, len(s.m))
	for _, m := range s.m {
		if matchSMC(f, m) {
			out = append(out, m)
		}
	}
	return out
}

var (
	smcOnce sync.Once
	smcBack smcStore
)

func smcState() smcStore {
	smcOnce.Do(func() {
		if dsn := os.Getenv("DATABASE_URL"); dsn != "" {
			if pg, err := newPgSMCStore(dsn); err == nil {
				smcBack = pg
				log.Printf("smc: using durable PostgreSQL store (DATABASE_URL set)")
			} else {
				log.Printf("smc: DATABASE_URL set but PostgreSQL unavailable (%v); using in-memory", err)
				smcBack = newMemSMCStore()
			}
		} else {
			smcBack = newMemSMCStore()
		}
		seedSMC(smcBack)
	})
	return smcBack
}

func smcNow() string { return "2026-06-25T00:00:00Z" }

// ScheduleSMCMeeting constitutes/schedules a new SMC meeting (status scheduled) after the RTE composition check.
func (p *Platform) ScheduleSMCMeeting(m SMCMeeting) (SMCMeeting, error) {
	m.Status = SMCScheduled
	m.PresentCount = 0
	m.Resolutions = nil
	if m.CreatedOn == "" {
		m.CreatedOn = "2026-06-25"
	}
	m.UpdatedAt = smcNow()
	if err := m.Validate(); err != nil {
		p.appendAudit("smc", "smc.schedule.denied", m.OrgUnit, "deny", err.Error())
		return SMCMeeting{}, err
	}
	out, err := smcState().Upsert(m)
	if err != nil {
		return SMCMeeting{}, err
	}
	p.appendAudit("smc", "smc.schedule", m.ID, "executed", m.Title)
	return out, nil
}

// ConveneSMCMeeting convenes a scheduled meeting with the attendance recorded — rejected without a quorum.
func (p *Platform) ConveneSMCMeeting(id string, present int) (SMCMeeting, error) {
	cur, ok := smcState().Get(id)
	if !ok {
		return SMCMeeting{}, errors.New("smc: not found")
	}
	out, err := applySMCConvene(cur, present, smcNow())
	if err != nil {
		p.appendAudit("smc", "smc.convene.denied", id, "deny", err.Error())
		return SMCMeeting{}, err
	}
	if _, err := smcState().Upsert(out); err != nil {
		return SMCMeeting{}, err
	}
	p.appendAudit("smc", "smc.convene", id, "executed", fmt.Sprintf("present %d/%d", present, out.TotalMembers))
	return out, nil
}

// PassSMCResolution records a resolution on a convened meeting.
func (p *Platform) PassSMCResolution(id string, r Resolution) (SMCMeeting, error) {
	cur, ok := smcState().Get(id)
	if !ok {
		return SMCMeeting{}, errors.New("smc: not found")
	}
	out, err := applySMCResolve(cur, r, smcNow())
	if err != nil {
		p.appendAudit("smc", "smc.resolve.denied", id, "deny", err.Error())
		return SMCMeeting{}, err
	}
	if _, err := smcState().Upsert(out); err != nil {
		return SMCMeeting{}, err
	}
	p.appendAudit("smc", "smc.resolve", id, "executed", r.Subject)
	return out, nil
}

// CompleteSMCResolution marks an open resolution done.
func (p *Platform) CompleteSMCResolution(id, resolutionID string) (SMCMeeting, error) {
	cur, ok := smcState().Get(id)
	if !ok {
		return SMCMeeting{}, errors.New("smc: not found")
	}
	out, err := applySMCComplete(cur, resolutionID, smcNow())
	if err != nil {
		p.appendAudit("smc", "smc.complete.denied", id, "deny", err.Error())
		return SMCMeeting{}, err
	}
	if _, err := smcState().Upsert(out); err != nil {
		return SMCMeeting{}, err
	}
	p.appendAudit("smc", "smc.complete", resolutionID, "executed", "resolution done")
	return out, nil
}

// CloseSMCMeeting closes a convened meeting.
func (p *Platform) CloseSMCMeeting(id string) (SMCMeeting, error) {
	cur, ok := smcState().Get(id)
	if !ok {
		return SMCMeeting{}, errors.New("smc: not found")
	}
	out, err := applySMCClose(cur, smcNow())
	if err != nil {
		p.appendAudit("smc", "smc.close.denied", id, "deny", err.Error())
		return SMCMeeting{}, err
	}
	if _, err := smcState().Upsert(out); err != nil {
		return SMCMeeting{}, err
	}
	p.appendAudit("smc", "smc.close", id, "executed", "closed")
	return out, nil
}

// SMCMeetingRecord returns a single meeting by id.
func (p *Platform) SMCMeetingRecord(id string) (SMCMeeting, bool) { return smcState().Get(id) }

// SMCDashboard is the jurisdiction-scoped governance picture: meeting counts by status, the quorate rate, the
// count of open action items (resolutions still open), and the open-action worklist. Downward-governance scoped.
type SMCDashboard struct {
	Scope       string         `json:"scope"`
	Meetings    int            `json:"meetings"`
	ByStatus    map[string]int `json:"by_status"`
	Convened    int            `json:"convened"`
	QuorateRate float64        `json:"quorate_rate"` // % of non-scheduled meetings that reached quorum (convened)
	Resolutions int            `json:"resolutions"`
	OpenActions int            `json:"open_actions"`
	ActionList  []Resolution   `json:"action_list,omitempty"` // open resolutions across governed schools
	Synthetic   bool           `json:"synthetic"`
}

// SMCDashboard rolls up SMC meetings across the schools a tenant node governs (fail-closed for others).
func (p *Platform) SMCDashboard(scopeOrg string) SMCDashboard {
	d := SMCDashboard{Scope: scopeOrg, ByStatus: map[string]int{}, Synthetic: true}
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return d
	}
	decided := 0
	for _, m := range smcState().List(smcFilter{}) {
		if !h.Governs(scopeOrg, m.OrgUnit) {
			continue
		}
		d.Meetings++
		d.ByStatus[m.Status]++
		if m.Status == SMCConvened || m.Status == SMCClosed {
			decided++
			d.Convened++
		}
		for _, r := range m.Resolutions {
			d.Resolutions++
			if r.Status == ResolutionOpen {
				d.OpenActions++
				d.ActionList = append(d.ActionList, r)
			}
		}
	}
	if decided > 0 {
		d.QuorateRate = float64(d.Convened) / float64(decided) * 100
	}
	return d
}

// ScopedSMCMeetings lists SMC meetings a tenant node governs (optionally filtered by status).
func (p *Platform) ScopedSMCMeetings(scopeOrg, status string) []SMCMeeting {
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return nil
	}
	var out []SMCMeeting
	for _, m := range smcState().List(smcFilter{Status: status}) {
		if h.Governs(scopeOrg, m.OrgUnit) {
			out = append(out, m)
		}
	}
	return out
}

// seedSMC plants an SMC meeting per school across more than one district: a convened meeting carrying both a
// completed and an open resolution, plus one still-scheduled meeting. Synthetic ids only.
func seedSMC(s smcStore) {
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
		// A convened quarterly review carrying resolutions.
		conv := SMCMeeting{
			ID: fmt.Sprintf("SMC-%s-Q1", tag), OrgUnit: school, Title: "Q1 School Development Review",
			ScheduledDate: "2026-06-10", TotalMembers: 12, ParentMembers: 9, CreatedOn: "2026-06-02", UpdatedAt: smcNow(),
		}
		conv.Status = SMCScheduled
		if c, err := applySMCConvene(conv, 8, smcNow()); err == nil {
			conv = c
			if r1, err := applySMCResolve(conv, Resolution{Subject: "Approve School Development Plan budget", Owner: "SYN-HM-" + tag, DueDate: "2026-07-15"}, smcNow()); err == nil {
				conv = r1
			}
			if r2, err := applySMCResolve(conv, Resolution{Subject: "Repair drinking-water unit", Owner: "SYN-PARENT-" + tag, DueDate: "2026-06-30"}, smcNow()); err == nil {
				conv = r2
			}
			// Complete the first resolution; leave the second open.
			if len(conv.Resolutions) > 0 {
				if done, err := applySMCComplete(conv, conv.Resolutions[0].ID, smcNow()); err == nil {
					conv = done
				}
			}
		}
		s.Upsert(conv)

		// An upcoming (still scheduled) meeting.
		upcoming := SMCMeeting{
			ID: fmt.Sprintf("SMC-%s-Q2", tag), OrgUnit: school, Title: "Q2 Mid-Day Meal & Safety Review",
			ScheduledDate: "2026-09-12", TotalMembers: 12, ParentMembers: 9, CreatedOn: "2026-06-20", UpdatedAt: smcNow(),
			Status: SMCScheduled,
		}
		if err := upcoming.Validate(); err == nil {
			s.Upsert(upcoming)
		}
	}
}
