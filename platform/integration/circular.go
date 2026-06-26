package integration

import (
	"errors"
	"fmt"
	"log"
	"os"
	"sort"
	"sync"
)

// Notice Board & Circulars is an L6 communications-compliance vertical: an office issues a circular to a defined
// set of recipients, publishes it, and tracks read-receipts (acknowledgements) until everyone has acknowledged.
// It is durable, audited, and enforces three hard invariants server-side:
//   - NO ACK BEFORE PUBLISH: a recipient cannot acknowledge a circular that is not in the published state.
//   - UNIQUE ACK: a recipient can acknowledge at most once (no duplicate read-receipt).
//   - ARCHIVE (COMPLIANCE) GATE: a circular can be archived only once every targeted recipient has acknowledged
//     it — you cannot close the loop while acknowledgements are outstanding.
// Acknowledgements are embedded on the circular (like hostel residents). Downward-governance scoped. Synthetic
// SYN- ids only, never real PII.

// Circular status.
const (
	CircDraft     = "draft"
	CircPublished = "published"
	CircArchived  = "archived"
)

func validCircularCategory(c string) bool {
	switch c {
	case "academic", "administrative", "safety", "examination", "finance":
		return true
	}
	return false
}

// CircularAck is one recipient's acknowledgement (read-receipt).
type CircularAck struct {
	RecipientID string `json:"recipient_id"`
	AckedOn     string `json:"acked_on"`
}

// Circular is one notice issued to a target audience with its read-receipts.
type Circular struct {
	ID          string        `json:"id"`
	OrgUnit     string        `json:"org_unit"`
	Title       string        `json:"title"`
	Category    string        `json:"category"`
	Summary     string        `json:"summary,omitempty"`
	TargetCount int           `json:"target_count"`
	Acks        []CircularAck `json:"acks,omitempty"`
	Status      string        `json:"status"`
	PublishedOn string        `json:"published_on,omitempty"`
	CreatedOn   string        `json:"created_on"`
	UpdatedAt   string        `json:"updated_at"`
}

// Acked is the number of acknowledgements received.
func (c Circular) Acked() int { return len(c.Acks) }

// Validate checks a circular's required fields.
func (c Circular) Validate() error {
	if c.ID == "" || c.OrgUnit == "" {
		return errors.New("circular: id and org_unit are required")
	}
	if c.Title == "" {
		return errors.New("circular: a title is required")
	}
	if !validCircularCategory(c.Category) {
		return errors.New("circular: category must be academic, administrative, safety, examination or finance")
	}
	if c.TargetCount < 1 {
		return errors.New("circular: target_count must be at least 1")
	}
	return nil
}

func (c Circular) hasAck(recipientID string) bool {
	for _, a := range c.Acks {
		if a.RecipientID == recipientID {
			return true
		}
	}
	return false
}

// applyPublishCircular moves a draft to published — rejected if it is not a draft.
func applyPublishCircular(c Circular, now string) (Circular, error) {
	if c.Status != CircDraft {
		return Circular{}, fmt.Errorf("circular: %s cannot be published from %s", c.ID, c.Status)
	}
	c.Status = CircPublished
	c.PublishedOn = "2026-06-25"
	c.UpdatedAt = now
	return c, nil
}

// applyAcknowledge records a read-receipt — rejected if not published or already acknowledged by this recipient.
func applyAcknowledge(c Circular, recipientID, now string) (Circular, error) {
	if recipientID == "" {
		return Circular{}, errors.New("circular: a recipient_id is required")
	}
	if c.Status != CircPublished {
		return Circular{}, fmt.Errorf("circular: %s is not published — cannot acknowledge (status %s)", c.ID, c.Status)
	}
	if c.hasAck(recipientID) {
		return Circular{}, fmt.Errorf("circular: %s has already acknowledged %s", recipientID, c.ID)
	}
	c.Acks = append(c.Acks, CircularAck{RecipientID: recipientID, AckedOn: "2026-06-25"})
	c.UpdatedAt = now
	return c, nil
}

// applyArchiveCircular archives a circular — rejected until every targeted recipient has acknowledged it.
func applyArchiveCircular(c Circular, now string) (Circular, error) {
	if c.Status != CircPublished {
		return Circular{}, fmt.Errorf("circular: %s cannot be archived from %s", c.ID, c.Status)
	}
	if c.Acked() < c.TargetCount {
		return Circular{}, fmt.Errorf("circular: cannot archive %s — %d of %d acknowledged", c.ID, c.Acked(), c.TargetCount)
	}
	c.Status = CircArchived
	c.UpdatedAt = now
	return c, nil
}

type circularFilter struct{ OrgUnit, Status, Category string }

func matchCircular(f circularFilter, c Circular) bool {
	if f.OrgUnit != "" && c.OrgUnit != f.OrgUnit {
		return false
	}
	if f.Status != "" && c.Status != f.Status {
		return false
	}
	if f.Category != "" && c.Category != f.Category {
		return false
	}
	return true
}

// circularStore is the persistence port. *memCircularStore and *pgCircularStore satisfy it.
type circularStore interface {
	Upsert(Circular) (Circular, error)
	Get(id string) (Circular, bool)
	List(circularFilter) []Circular
}

type memCircularStore struct {
	mu sync.Mutex
	m  map[string]Circular
}

func newMemCircularStore() *memCircularStore { return &memCircularStore{m: map[string]Circular{}} }

func (s *memCircularStore) Upsert(c Circular) (Circular, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.m[c.ID] = c
	return c, nil
}

func (s *memCircularStore) Get(id string) (Circular, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	c, ok := s.m[id]
	return c, ok
}

func (s *memCircularStore) List(f circularFilter) []Circular {
	s.mu.Lock()
	defer s.mu.Unlock()
	out := make([]Circular, 0, len(s.m))
	for _, c := range s.m {
		if matchCircular(f, c) {
			out = append(out, c)
		}
	}
	return out
}

var (
	circularOnce sync.Once
	circularBack circularStore
)

func circularState() circularStore {
	circularOnce.Do(func() {
		if dsn := os.Getenv("DATABASE_URL"); dsn != "" {
			if pg, err := newPgCircularStore(dsn); err == nil {
				circularBack = pg
				log.Printf("circular: using durable PostgreSQL store (DATABASE_URL set)")
			} else {
				log.Printf("circular: DATABASE_URL set but PostgreSQL unavailable (%v); using in-memory", err)
				circularBack = newMemCircularStore()
			}
		} else {
			circularBack = newMemCircularStore()
		}
		seedCircular(circularBack)
	})
	return circularBack
}

func circularNow() string { return "2026-06-25T00:00:00Z" }

// CreateCircular records a new circular (status draft). Audited.
func (p *Platform) CreateCircular(c Circular) (Circular, error) {
	c.Status = CircDraft
	c.Acks = nil
	c.PublishedOn = ""
	if c.CreatedOn == "" {
		c.CreatedOn = "2026-06-25"
	}
	c.UpdatedAt = circularNow()
	if err := c.Validate(); err != nil {
		p.appendAudit("comms-officer", "circular.create.denied", c.OrgUnit, "deny", err.Error())
		return Circular{}, err
	}
	out, err := circularState().Upsert(c)
	if err != nil {
		return Circular{}, err
	}
	p.appendAudit("comms-officer", "circular.create", c.ID, "executed", fmt.Sprintf("%s (%s)", c.Title, c.Category))
	return out, nil
}

// PublishCircular publishes a draft circular. Audited.
func (p *Platform) PublishCircular(id string) (Circular, error) {
	cur, ok := circularState().Get(id)
	if !ok {
		return Circular{}, errors.New("circular: not found")
	}
	out, err := applyPublishCircular(cur, circularNow())
	if err != nil {
		p.appendAudit("comms-officer", "circular.publish.denied", id, "deny", err.Error())
		return Circular{}, err
	}
	if _, err := circularState().Upsert(out); err != nil {
		return Circular{}, err
	}
	p.appendAudit("comms-officer", "circular.publish", id, "executed", "published")
	return out, nil
}

// AcknowledgeCircular records a recipient's read-receipt — rejecting an unpublished or duplicate ack. Audited.
func (p *Platform) AcknowledgeCircular(id, recipientID string) (Circular, error) {
	cur, ok := circularState().Get(id)
	if !ok {
		return Circular{}, errors.New("circular: not found")
	}
	out, err := applyAcknowledge(cur, recipientID, circularNow())
	if err != nil {
		p.appendAudit("comms-officer", "circular.ack.denied", id, "deny", err.Error())
		return Circular{}, err
	}
	if _, err := circularState().Upsert(out); err != nil {
		return Circular{}, err
	}
	p.appendAudit("comms-officer", "circular.ack", id, "executed", fmt.Sprintf("%s (%d/%d)", recipientID, out.Acked(), out.TargetCount))
	return out, nil
}

// ArchiveCircular archives a fully-acknowledged circular. Audited.
func (p *Platform) ArchiveCircular(id string) (Circular, error) {
	cur, ok := circularState().Get(id)
	if !ok {
		return Circular{}, errors.New("circular: not found")
	}
	out, err := applyArchiveCircular(cur, circularNow())
	if err != nil {
		p.appendAudit("comms-officer", "circular.archive.denied", id, "deny", err.Error())
		return Circular{}, err
	}
	if _, err := circularState().Upsert(out); err != nil {
		return Circular{}, err
	}
	p.appendAudit("comms-officer", "circular.archive", id, "executed", "archived")
	return out, nil
}

// CircularRecord returns a single circular by id.
func (p *Platform) CircularRecord(id string) (Circular, bool) { return circularState().Get(id) }

// CircularDashboard is the jurisdiction-scoped notice picture: circulars by status, target/ack totals, the overall
// acknowledgement rate, and the pending-acknowledgement worklist. Downward-governance scoped.
type CircularDashboard struct {
	Scope     string         `json:"scope"`
	Circulars int            `json:"circulars"`
	ByStatus  map[string]int `json:"by_status"`
	Targets   int            `json:"targets"`
	Acks      int            `json:"acks"`
	AckPct    float64        `json:"ack_pct"`
	Pending   []Circular     `json:"pending,omitempty"`
	Synthetic bool           `json:"synthetic"`
}

// CircularDashboard rolls up circulars across the schools a tenant node governs (fail-closed for others).
func (p *Platform) CircularDashboard(scopeOrg string) CircularDashboard {
	d := CircularDashboard{Scope: scopeOrg, ByStatus: map[string]int{}, Synthetic: true}
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return d
	}
	for _, c := range circularState().List(circularFilter{}) {
		if !h.Governs(scopeOrg, c.OrgUnit) {
			continue
		}
		d.Circulars++
		d.ByStatus[c.Status]++
		d.Targets += c.TargetCount
		d.Acks += c.Acked()
		if c.Status == CircPublished && c.Acked() < c.TargetCount {
			d.Pending = append(d.Pending, c)
		}
	}
	if d.Targets > 0 {
		d.AckPct = float64(d.Acks) / float64(d.Targets) * 100
	}
	sort.Slice(d.Pending, func(i, j int) bool { return d.Pending[i].ID < d.Pending[j].ID })
	return d
}

// ScopedCirculars lists circulars a tenant node governs (optionally filtered by status).
func (p *Platform) ScopedCirculars(scopeOrg, status string) []Circular {
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return nil
	}
	var out []Circular
	for _, c := range circularState().List(circularFilter{Status: status}) {
		if h.Governs(scopeOrg, c.OrgUnit) {
			out = append(out, c)
		}
	}
	return out
}

// seedCircular plants circulars per school across more than one district: one published and partly acknowledged,
// one published and fully acknowledged (archive-ready), and one still in draft. Synthetic SYN- ids only.
func seedCircular(s circularStore) {
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

		// Exam circular — published, 3 of 5 acknowledged.
		exam := Circular{
			ID: fmt.Sprintf("CIR-%s-EXAM", tag), OrgUnit: school, Title: "Half-yearly exam schedule", Category: "examination",
			Summary: "Datesheet and seating plan", TargetCount: 5, Status: CircDraft, CreatedOn: "2026-06-15", UpdatedAt: circularNow(),
		}
		exam, _ = applyPublishCircular(exam, circularNow())
		for i := 0; i < 3; i++ {
			exam, _ = applyAcknowledge(exam, fmt.Sprintf("SYN-T-%s-%02d", tag, i+1), circularNow())
		}
		s.Upsert(exam)

		// Safety circular — published and fully acknowledged (archive-ready).
		safety := Circular{
			ID: fmt.Sprintf("CIR-%s-SAFE", tag), OrgUnit: school, Title: "Fire-drill protocol", Category: "safety",
			Summary: "Quarterly evacuation drill", TargetCount: 3, Status: CircDraft, CreatedOn: "2026-06-10", UpdatedAt: circularNow(),
		}
		safety, _ = applyPublishCircular(safety, circularNow())
		for i := 0; i < 3; i++ {
			safety, _ = applyAcknowledge(safety, fmt.Sprintf("SYN-T-%s-%02d", tag, i+1), circularNow())
		}
		s.Upsert(safety)

		// Admin circular — still a draft.
		admin := Circular{
			ID: fmt.Sprintf("CIR-%s-ADMIN", tag), OrgUnit: school, Title: "Staff meeting agenda", Category: "administrative",
			Summary: "Monthly review", TargetCount: 6, Status: CircDraft, CreatedOn: "2026-06-22", UpdatedAt: circularNow(),
		}
		if err := admin.Validate(); err == nil {
			s.Upsert(admin)
		}
	}
}
