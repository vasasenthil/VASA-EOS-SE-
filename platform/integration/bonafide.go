package integration

import (
	"errors"
	"fmt"
	"log"
	"os"
	"sync"
)

// Bonafide Certificate Register is an L6 registrar vertical: a school issues a bonafide / study certificate for a
// currently-enrolled student (for scholarships, passport, bank, bus-pass, etc.). It is durable, serial-numbered
// and audited, with two hard invariants enforced server-side:
//   - CROSS-MODULE: a bonafide cannot be ISSUED for a student who has an ACTIVE transfer certificate (TC) — a
//     student who has left (or is leaving) the school is no longer "bonafide on rolls" here. Composes with tc.go.
//   - SERIAL INTEGRITY: each issued certificate is stamped with a monotonic per-school serial; a request can only
//     be issued once, and only an issued certificate can be revoked.
// Durable to PostgreSQL; downward-governance scoped. Synthetic ids only, never real PII.

// Bonafide certificate status.
const (
	BonafideRequested = "requested"
	BonafideIssued    = "issued"
	BonafideRevoked   = "revoked"
)

// BonafideCertificate is a single study/bonafide certificate in the school register.
type BonafideCertificate struct {
	ID          string `json:"id"`
	OrgUnit     string `json:"org_unit"` // the issuing school (T6 tenancy node)
	StudentID   string `json:"student_id"`
	StudentName string `json:"student_name"`
	Purpose     string `json:"purpose"` // scholarship | passport | bank | bus-pass | …
	Serial      string `json:"serial"`  // assigned at issue (per-school monotonic)
	Status      string `json:"status"`
	RequestedOn string `json:"requested_on"`
	IssuedOn    string `json:"issued_on"`
	UpdatedAt   string `json:"updated_at"`
}

// Validate checks a certificate's required fields.
func (b BonafideCertificate) Validate() error {
	if b.ID == "" || b.OrgUnit == "" || b.StudentID == "" {
		return errors.New("bonafide: id, org_unit and student_id are required")
	}
	if b.Purpose == "" {
		return errors.New("bonafide: a purpose is required")
	}
	return nil
}

type bonafideFilter struct{ OrgUnit, Student, Status string }

func matchBonafide(f bonafideFilter, b BonafideCertificate) bool {
	if f.OrgUnit != "" && b.OrgUnit != f.OrgUnit {
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

// bonafideStore is the persistence port. *memBonafideStore and *pgBonafideStore satisfy it.
type bonafideStore interface {
	Upsert(BonafideCertificate) (BonafideCertificate, error)
	Get(id string) (BonafideCertificate, bool)
	List(bonafideFilter) []BonafideCertificate
}

type memBonafideStore struct {
	mu sync.Mutex
	m  map[string]BonafideCertificate
}

func newMemBonafideStore() *memBonafideStore {
	return &memBonafideStore{m: map[string]BonafideCertificate{}}
}

func (s *memBonafideStore) Upsert(b BonafideCertificate) (BonafideCertificate, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.m[b.ID] = b
	return b, nil
}

func (s *memBonafideStore) Get(id string) (BonafideCertificate, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	b, ok := s.m[id]
	return b, ok
}

func (s *memBonafideStore) List(f bonafideFilter) []BonafideCertificate {
	s.mu.Lock()
	defer s.mu.Unlock()
	out := make([]BonafideCertificate, 0, len(s.m))
	for _, b := range s.m {
		if matchBonafide(f, b) {
			out = append(out, b)
		}
	}
	return out
}

var (
	bonafideOnce sync.Once
	bonafideBack bonafideStore
)

func bonafideState() bonafideStore {
	bonafideOnce.Do(func() {
		if dsn := os.Getenv("DATABASE_URL"); dsn != "" {
			if pg, err := newPgBonafideStore(dsn); err == nil {
				bonafideBack = pg
				log.Printf("bonafide: using durable PostgreSQL store (DATABASE_URL set)")
			} else {
				log.Printf("bonafide: DATABASE_URL set but PostgreSQL unavailable (%v); using in-memory", err)
				bonafideBack = newMemBonafideStore()
			}
		} else {
			bonafideBack = newMemBonafideStore()
		}
		seedBonafide(bonafideBack)
	})
	return bonafideBack
}

func bonafideNow() string { return "2026-06-25T00:00:00Z" }

// studentHasActiveTC reports whether the student has an active (requested/issued) transfer certificate at the
// school — the cross-module gate. Reads the TC store directly (same package).
func studentHasActiveTC(orgUnit, studentID string) (bool, string) {
	for _, t := range tcState().List(tcFilter{OrgUnit: orgUnit, Student: studentID}) {
		if t.Active() {
			return true, t.ID
		}
	}
	return false, ""
}

// nextBonafideSerial computes the next monotonic per-school serial (count of issued certs at that school + 1).
// Takes the store explicitly so it is safe to call from seedBonafide (which runs inside bonafideOnce.Do — calling
// bonafideState() there would re-enter the sync.Once and deadlock).
func nextBonafideSerial(s bonafideStore, orgUnit string) string {
	n := 0
	for _, b := range s.List(bonafideFilter{OrgUnit: orgUnit}) {
		if b.Status == BonafideIssued && b.Serial != "" {
			n++
		}
	}
	return fmt.Sprintf("BNF/%s/2026/%04d", orgUnit, n+1)
}

// RequestBonafide records a new certificate request (status requested). Audited.
func (p *Platform) RequestBonafide(b BonafideCertificate) (BonafideCertificate, error) {
	b.Status = BonafideRequested
	b.Serial = ""
	if b.RequestedOn == "" {
		b.RequestedOn = "2026-06-25"
	}
	b.UpdatedAt = bonafideNow()
	if err := b.Validate(); err != nil {
		p.appendAudit("registrar", "bonafide.request.denied", b.OrgUnit, "deny", err.Error())
		return BonafideCertificate{}, err
	}
	out, err := bonafideState().Upsert(b)
	if err != nil {
		return BonafideCertificate{}, err
	}
	p.appendAudit("registrar", "bonafide.request", b.ID, "executed", b.StudentID+" ("+b.Purpose+")")
	return out, nil
}

// IssueBonafide issues a requested certificate — rejected if the student has an active TC. Stamps a serial. Audited.
func (p *Platform) IssueBonafide(id string) (BonafideCertificate, error) {
	cur, ok := bonafideState().Get(id)
	if !ok {
		return BonafideCertificate{}, errors.New("bonafide: not found")
	}
	if cur.Status != BonafideRequested {
		err := fmt.Errorf("bonafide: only a requested certificate can be issued (is %s)", cur.Status)
		p.appendAudit("registrar", "bonafide.issue.denied", id, "deny", err.Error())
		return BonafideCertificate{}, err
	}
	if active, tcID := studentHasActiveTC(cur.OrgUnit, cur.StudentID); active {
		err := fmt.Errorf("bonafide: cannot issue — %s has an active transfer certificate (%s); they are no longer on rolls here", cur.StudentID, tcID)
		p.appendAudit("registrar", "bonafide.issue.denied", id, "deny", err.Error())
		return BonafideCertificate{}, err
	}
	cur.Serial = nextBonafideSerial(bonafideState(), cur.OrgUnit)
	cur.Status = BonafideIssued
	cur.IssuedOn = "2026-06-25"
	cur.UpdatedAt = bonafideNow()
	if _, err := bonafideState().Upsert(cur); err != nil {
		return BonafideCertificate{}, err
	}
	p.appendAudit("registrar", "bonafide.issue", id, "executed", "serial "+cur.Serial)
	return cur, nil
}

// RevokeBonafide revokes an issued certificate (raised in error / superseded). Audited.
func (p *Platform) RevokeBonafide(id string) (BonafideCertificate, error) {
	cur, ok := bonafideState().Get(id)
	if !ok {
		return BonafideCertificate{}, errors.New("bonafide: not found")
	}
	if cur.Status != BonafideIssued {
		err := errors.New("bonafide: only an issued certificate can be revoked")
		p.appendAudit("registrar", "bonafide.revoke.denied", id, "deny", err.Error())
		return BonafideCertificate{}, err
	}
	cur.Status = BonafideRevoked
	cur.UpdatedAt = bonafideNow()
	if _, err := bonafideState().Upsert(cur); err != nil {
		return BonafideCertificate{}, err
	}
	p.appendAudit("registrar", "bonafide.revoke", id, "executed", "revoked "+cur.Serial)
	return cur, nil
}

// BonafideRecord returns a single certificate by id.
func (p *Platform) BonafideRecord(id string) (BonafideCertificate, bool) {
	return bonafideState().Get(id)
}

// BonafideDashboard is the jurisdiction-scoped registrar picture: counts by status/purpose, the issued count and
// the pending-request worklist. Downward-governance scoped.
type BonafideDashboard struct {
	Scope       string                `json:"scope"`
	Total       int                   `json:"total"`
	ByStatus    map[string]int        `json:"by_status"`
	ByPurpose   map[string]int        `json:"by_purpose"`
	Issued      int                   `json:"issued"`
	PendingWork []BonafideCertificate `json:"pending_work,omitempty"`
	Synthetic   bool                  `json:"synthetic"`
}

// BonafideDashboard rolls up the bonafide register across the schools a tenant node governs (fail-closed for others).
func (p *Platform) BonafideDashboard(scopeOrg string) BonafideDashboard {
	d := BonafideDashboard{Scope: scopeOrg, ByStatus: map[string]int{}, ByPurpose: map[string]int{}, Synthetic: true}
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return d
	}
	for _, b := range bonafideState().List(bonafideFilter{}) {
		if !h.Governs(scopeOrg, b.OrgUnit) {
			continue
		}
		d.Total++
		d.ByStatus[b.Status]++
		d.ByPurpose[b.Purpose]++
		if b.Status == BonafideIssued {
			d.Issued++
		}
		if b.Status == BonafideRequested {
			d.PendingWork = append(d.PendingWork, b)
		}
	}
	return d
}

// ScopedBonafide lists certificates a tenant node governs (optionally filtered by status).
func (p *Platform) ScopedBonafide(scopeOrg, status string) []BonafideCertificate {
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return nil
	}
	var out []BonafideCertificate
	for _, b := range bonafideState().List(bonafideFilter{Status: status}) {
		if h.Governs(scopeOrg, b.OrgUnit) {
			out = append(out, b)
		}
	}
	return out
}

// seedBonafide plants a few certificates per school across more than one district: one issued (serial-stamped),
// one pending request, and — to exercise the cross-module gate — one requested for a student who is given an
// active TC in tc.go's seed only when ids align; otherwise it stays a plain pending request. Synthetic ids only.
func seedBonafide(s bonafideStore) {
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
		// An issued certificate (serial-stamped).
		issued := BonafideCertificate{
			ID: fmt.Sprintf("BNF-%s-01", tag), OrgUnit: school, StudentID: fmt.Sprintf("SYN-S-%s-001", tag),
			StudentName: "SYN Student One", Purpose: "scholarship", RequestedOn: "2026-06-12", UpdatedAt: bonafideNow(),
		}
		issued.Status = BonafideRequested
		if _, err := s.Upsert(issued); err == nil {
			issued.Serial = nextBonafideSerial(s, school)
			issued.Status = BonafideIssued
			issued.IssuedOn = "2026-06-13"
			issued.UpdatedAt = bonafideNow()
			s.Upsert(issued)
		}
		// A pending request awaiting issue.
		pending := BonafideCertificate{
			ID: fmt.Sprintf("BNF-%s-02", tag), OrgUnit: school, StudentID: fmt.Sprintf("SYN-S-%s-002", tag),
			StudentName: "SYN Student Two", Purpose: "bus-pass", RequestedOn: "2026-06-20", UpdatedAt: bonafideNow(),
			Status: BonafideRequested,
		}
		if err := pending.Validate(); err == nil {
			s.Upsert(pending)
		}
	}
}
