package integration

import (
	"errors"
	"fmt"
	"log"
	"os"
	"sort"
	"sync"
)

// Staff Disciplinary / Vigilance is an L6 HR-governance vertical for due-process disciplinary proceedings against
// staff (under the service rules) — distinct from the citizen-facing grievance flow. A charge is issued, an
// inquiry is held, a penalty is decided, and the official may appeal. It is durable, audited, and enforces three
// hard invariants server-side, encoding natural justice:
//   - NO PENALTY WITHOUT INQUIRY: a case cannot be decided (a penalty imposed) until an inquiry has been held —
//     no punishment without a hearing.
//   - VALID PENALTY: a decision must carry a penalty from the sanctioned schedule (minor/major).
//   - APPEAL ONLY AFTER DECISION: an appeal can only be filed against a decided case, before it is closed.
// Stages advance in order (charge_issued → under_inquiry → decided → closed); a closed case is terminal.
// Downward-governance scoped. Synthetic SYN- ids only, never real PII.

// Case stage.
const (
	DiscCharged = "charge_issued"
	DiscInquiry = "under_inquiry"
	DiscDecided = "decided"
	DiscClosed  = "closed"
)

// validPenalty covers the sanctioned schedule: minor (censure, withholding increment) and major (recovery,
// reduction in rank, compulsory retirement, removal, dismissal).
func validPenalty(p string) bool {
	switch p {
	case "censure", "withhold_increment", "recovery", "reduction_in_rank", "compulsory_retirement", "removal", "dismissal":
		return true
	}
	return false
}

// DisciplinaryCase is one staff disciplinary proceeding.
type DisciplinaryCase struct {
	ID              string `json:"id"`
	OrgUnit         string `json:"org_unit"`
	EmployeeID      string `json:"employee_id"`
	Charge          string `json:"charge"`
	InquiryFindings string `json:"inquiry_findings,omitempty"`
	Penalty         string `json:"penalty,omitempty"`
	AppealGrounds   string `json:"appeal_grounds,omitempty"`
	Appealed        bool   `json:"appealed"`
	Stage           string `json:"stage"`
	CreatedOn       string `json:"created_on"`
	UpdatedAt       string `json:"updated_at"`
}

// Validate checks a case's required fields.
func (c DisciplinaryCase) Validate() error {
	if c.ID == "" || c.OrgUnit == "" {
		return errors.New("disciplinary: id and org_unit are required")
	}
	if c.EmployeeID == "" {
		return errors.New("disciplinary: an employee_id is required")
	}
	if c.Charge == "" {
		return errors.New("disciplinary: a charge is required")
	}
	return nil
}

// applyInquiry records the inquiry findings — rejected unless the case is at charge_issued.
func applyInquiry(c DisciplinaryCase, findings, now string) (DisciplinaryCase, error) {
	if c.Stage != DiscCharged {
		return DisciplinaryCase{}, fmt.Errorf("disciplinary: %s is not at charge_issued (stage %s) — cannot hold inquiry", c.ID, c.Stage)
	}
	if findings == "" {
		return DisciplinaryCase{}, errors.New("disciplinary: inquiry findings are required")
	}
	c.InquiryFindings = findings
	c.Stage = DiscInquiry
	c.UpdatedAt = now
	return c, nil
}

// applyDecide imposes a penalty — rejected without a completed inquiry (no penalty without a hearing) or an
// invalid penalty.
func applyDecide(c DisciplinaryCase, penalty, now string) (DisciplinaryCase, error) {
	if c.Stage != DiscInquiry {
		return DisciplinaryCase{}, fmt.Errorf("disciplinary: cannot decide %s — no inquiry held (stage %s); no penalty without a hearing", c.ID, c.Stage)
	}
	if !validPenalty(penalty) {
		return DisciplinaryCase{}, errors.New("disciplinary: penalty must be a sanctioned penalty (censure, withhold_increment, recovery, reduction_in_rank, compulsory_retirement, removal, dismissal)")
	}
	c.Penalty = penalty
	c.Stage = DiscDecided
	c.UpdatedAt = now
	return c, nil
}

// applyAppeal records an appeal — rejected unless the case is decided (and not yet closed).
func applyAppeal(c DisciplinaryCase, grounds, now string) (DisciplinaryCase, error) {
	if c.Stage != DiscDecided {
		return DisciplinaryCase{}, fmt.Errorf("disciplinary: cannot appeal %s — only a decided case may be appealed (stage %s)", c.ID, c.Stage)
	}
	if grounds == "" {
		return DisciplinaryCase{}, errors.New("disciplinary: appeal grounds are required")
	}
	c.AppealGrounds = grounds
	c.Appealed = true
	c.UpdatedAt = now
	return c, nil
}

// applyCloseCase closes a decided case.
func applyCloseCase(c DisciplinaryCase, now string) (DisciplinaryCase, error) {
	if c.Stage != DiscDecided {
		return DisciplinaryCase{}, fmt.Errorf("disciplinary: cannot close %s — only a decided case may be closed (stage %s)", c.ID, c.Stage)
	}
	c.Stage = DiscClosed
	c.UpdatedAt = now
	return c, nil
}

type disciplinaryFilter struct{ OrgUnit, Stage string }

func matchDisciplinary(f disciplinaryFilter, c DisciplinaryCase) bool {
	if f.OrgUnit != "" && c.OrgUnit != f.OrgUnit {
		return false
	}
	if f.Stage != "" && c.Stage != f.Stage {
		return false
	}
	return true
}

// disciplinaryStore is the persistence port. *memDisciplinaryStore and *pgDisciplinaryStore satisfy it.
type disciplinaryStore interface {
	Upsert(DisciplinaryCase) (DisciplinaryCase, error)
	Get(id string) (DisciplinaryCase, bool)
	List(disciplinaryFilter) []DisciplinaryCase
}

type memDisciplinaryStore struct {
	mu sync.Mutex
	m  map[string]DisciplinaryCase
}

func newMemDisciplinaryStore() *memDisciplinaryStore {
	return &memDisciplinaryStore{m: map[string]DisciplinaryCase{}}
}

func (s *memDisciplinaryStore) Upsert(c DisciplinaryCase) (DisciplinaryCase, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.m[c.ID] = c
	return c, nil
}

func (s *memDisciplinaryStore) Get(id string) (DisciplinaryCase, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	c, ok := s.m[id]
	return c, ok
}

func (s *memDisciplinaryStore) List(f disciplinaryFilter) []DisciplinaryCase {
	s.mu.Lock()
	defer s.mu.Unlock()
	out := make([]DisciplinaryCase, 0, len(s.m))
	for _, c := range s.m {
		if matchDisciplinary(f, c) {
			out = append(out, c)
		}
	}
	return out
}

var (
	disciplinaryOnce sync.Once
	disciplinaryBack disciplinaryStore
)

func disciplinaryState() disciplinaryStore {
	disciplinaryOnce.Do(func() {
		if dsn := os.Getenv("DATABASE_URL"); dsn != "" {
			if pg, err := newPgDisciplinaryStore(dsn); err == nil {
				disciplinaryBack = pg
				log.Printf("disciplinary: using durable PostgreSQL store (DATABASE_URL set)")
			} else {
				log.Printf("disciplinary: DATABASE_URL set but PostgreSQL unavailable (%v); using in-memory", err)
				disciplinaryBack = newMemDisciplinaryStore()
			}
		} else {
			disciplinaryBack = newMemDisciplinaryStore()
		}
		seedDisciplinary(disciplinaryBack)
	})
	return disciplinaryBack
}

func disciplinaryNow() string { return "2026-06-25T00:00:00Z" }

// IssueCharge opens a disciplinary case (stage charge_issued). Audited.
func (p *Platform) IssueCharge(c DisciplinaryCase) (DisciplinaryCase, error) {
	c.Stage = DiscCharged
	c.InquiryFindings = ""
	c.Penalty = ""
	c.Appealed = false
	if c.CreatedOn == "" {
		c.CreatedOn = "2026-06-25"
	}
	c.UpdatedAt = disciplinaryNow()
	if err := c.Validate(); err != nil {
		p.appendAudit("vigilance-officer", "disciplinary.charge.denied", c.OrgUnit, "deny", err.Error())
		return DisciplinaryCase{}, err
	}
	out, err := disciplinaryState().Upsert(c)
	if err != nil {
		return DisciplinaryCase{}, err
	}
	p.appendAudit("vigilance-officer", "disciplinary.charge", c.ID, "executed", fmt.Sprintf("%s: %s", c.EmployeeID, c.Charge))
	return out, nil
}

// HoldInquiry records inquiry findings. Audited.
func (p *Platform) HoldInquiry(id, findings string) (DisciplinaryCase, error) {
	cur, ok := disciplinaryState().Get(id)
	if !ok {
		return DisciplinaryCase{}, errors.New("disciplinary: not found")
	}
	out, err := applyInquiry(cur, findings, disciplinaryNow())
	if err != nil {
		p.appendAudit("vigilance-officer", "disciplinary.inquiry.denied", id, "deny", err.Error())
		return DisciplinaryCase{}, err
	}
	if _, err := disciplinaryState().Upsert(out); err != nil {
		return DisciplinaryCase{}, err
	}
	p.appendAudit("vigilance-officer", "disciplinary.inquiry", id, "executed", "inquiry held")
	return out, nil
}

// DecideCase imposes a penalty — rejecting a decision without an inquiry. Audited.
func (p *Platform) DecideCase(id, penalty string) (DisciplinaryCase, error) {
	cur, ok := disciplinaryState().Get(id)
	if !ok {
		return DisciplinaryCase{}, errors.New("disciplinary: not found")
	}
	out, err := applyDecide(cur, penalty, disciplinaryNow())
	if err != nil {
		p.appendAudit("vigilance-officer", "disciplinary.decide.denied", id, "deny", err.Error())
		return DisciplinaryCase{}, err
	}
	if _, err := disciplinaryState().Upsert(out); err != nil {
		return DisciplinaryCase{}, err
	}
	p.appendAudit("vigilance-officer", "disciplinary.decide", id, "executed", penalty)
	return out, nil
}

// AppealCase records an appeal against a decided case. Audited.
func (p *Platform) AppealCase(id, grounds string) (DisciplinaryCase, error) {
	cur, ok := disciplinaryState().Get(id)
	if !ok {
		return DisciplinaryCase{}, errors.New("disciplinary: not found")
	}
	out, err := applyAppeal(cur, grounds, disciplinaryNow())
	if err != nil {
		p.appendAudit("vigilance-officer", "disciplinary.appeal.denied", id, "deny", err.Error())
		return DisciplinaryCase{}, err
	}
	if _, err := disciplinaryState().Upsert(out); err != nil {
		return DisciplinaryCase{}, err
	}
	p.appendAudit("vigilance-officer", "disciplinary.appeal", id, "executed", "appeal filed")
	return out, nil
}

// CloseCase closes a decided case. Audited.
func (p *Platform) CloseCase(id string) (DisciplinaryCase, error) {
	cur, ok := disciplinaryState().Get(id)
	if !ok {
		return DisciplinaryCase{}, errors.New("disciplinary: not found")
	}
	out, err := applyCloseCase(cur, disciplinaryNow())
	if err != nil {
		p.appendAudit("vigilance-officer", "disciplinary.close.denied", id, "deny", err.Error())
		return DisciplinaryCase{}, err
	}
	if _, err := disciplinaryState().Upsert(out); err != nil {
		return DisciplinaryCase{}, err
	}
	p.appendAudit("vigilance-officer", "disciplinary.close", id, "executed", "closed")
	return out, nil
}

// DisciplinaryCaseRecord returns a single case by id.
func (p *Platform) DisciplinaryCaseRecord(id string) (DisciplinaryCase, bool) {
	return disciplinaryState().Get(id)
}

// DisciplinaryDashboard is the jurisdiction-scoped vigilance picture: cases by stage, by penalty, the
// pending-inquiry worklist, and the under-appeal count. Downward-governance scoped.
type DisciplinaryDashboard struct {
	Scope          string             `json:"scope"`
	Cases          int                `json:"cases"`
	ByStage        map[string]int     `json:"by_stage"`
	ByPenalty      map[string]int     `json:"by_penalty"`
	UnderAppeal    int                `json:"under_appeal"`
	PendingInquiry []DisciplinaryCase `json:"pending_inquiry,omitempty"`
	Synthetic      bool               `json:"synthetic"`
}

// DisciplinaryDashboard rolls up cases across the schools a tenant node governs (fail-closed for others).
func (p *Platform) DisciplinaryDashboard(scopeOrg string) DisciplinaryDashboard {
	d := DisciplinaryDashboard{Scope: scopeOrg, ByStage: map[string]int{}, ByPenalty: map[string]int{}, Synthetic: true}
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return d
	}
	for _, c := range disciplinaryState().List(disciplinaryFilter{}) {
		if !h.Governs(scopeOrg, c.OrgUnit) {
			continue
		}
		d.Cases++
		d.ByStage[c.Stage]++
		if c.Penalty != "" {
			d.ByPenalty[c.Penalty]++
		}
		if c.Appealed {
			d.UnderAppeal++
		}
		if c.Stage == DiscCharged {
			d.PendingInquiry = append(d.PendingInquiry, c)
		}
	}
	sort.Slice(d.PendingInquiry, func(i, j int) bool { return d.PendingInquiry[i].ID < d.PendingInquiry[j].ID })
	return d
}

// ScopedDisciplinaryCases lists cases a tenant node governs (optionally filtered by stage).
func (p *Platform) ScopedDisciplinaryCases(scopeOrg, stage string) []DisciplinaryCase {
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return nil
	}
	var out []DisciplinaryCase
	for _, c := range disciplinaryState().List(disciplinaryFilter{Stage: stage}) {
		if h.Governs(scopeOrg, c.OrgUnit) {
			out = append(out, c)
		}
	}
	return out
}

// seedDisciplinary plants cases per school across more than one district: one freshly charged (pending inquiry),
// one inquiry-held awaiting decision, and one decided-and-appealed. Synthetic SYN- ids only.
func seedDisciplinary(s disciplinaryStore) {
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

		// Charged — pending inquiry.
		charged := DisciplinaryCase{
			ID: fmt.Sprintf("DIS-%s-01", tag), OrgUnit: school, EmployeeID: fmt.Sprintf("SYN-T-%s-11", tag),
			Charge: "Unauthorised absence", Stage: DiscCharged, CreatedOn: "2026-06-18", UpdatedAt: disciplinaryNow(),
		}
		s.Upsert(charged)

		// Inquiry held — awaiting decision.
		inq := DisciplinaryCase{
			ID: fmt.Sprintf("DIS-%s-02", tag), OrgUnit: school, EmployeeID: fmt.Sprintf("SYN-T-%s-12", tag),
			Charge: "Negligence of duty", Stage: DiscCharged, CreatedOn: "2026-06-12", UpdatedAt: disciplinaryNow(),
		}
		inq, _ = applyInquiry(inq, "Charge substantiated on two of three counts", disciplinaryNow())
		s.Upsert(inq)

		// Decided and appealed.
		dec := DisciplinaryCase{
			ID: fmt.Sprintf("DIS-%s-03", tag), OrgUnit: school, EmployeeID: fmt.Sprintf("SYN-T-%s-13", tag),
			Charge: "Misconduct", Stage: DiscCharged, CreatedOn: "2026-06-05", UpdatedAt: disciplinaryNow(),
		}
		dec, _ = applyInquiry(dec, "Charge proved", disciplinaryNow())
		dec, _ = applyDecide(dec, "withhold_increment", disciplinaryNow())
		dec, _ = applyAppeal(dec, "Penalty disproportionate to the proven charge", disciplinaryNow())
		s.Upsert(dec)
	}
}
