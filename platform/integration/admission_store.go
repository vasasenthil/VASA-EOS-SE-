package integration

import (
	"log"
	"os"
	"sort"
	"strings"
	"sync"
)

// AdmissionApplication is the durable record of an admission decision. PII (the applicant's name) is NOT stored
// here in clear — it is sealed under the tenant KEK during the workflow; this record keeps only the decision,
// the governing reasons, the HITL/credential references and a flag that PII was enveloped.
type AdmissionApplication struct {
	ID           string `json:"id"` // applicant id
	Category     string `json:"category"`
	Age          int    `json:"age"`
	Tenant       string `json:"tenant"`
	Region       string `json:"region"`
	Decision     string `json:"decision"` // admit | reject (requested)
	Stage        string `json:"stage"`    // admitted | denied | pending-approval | residency
	Effect       string `json:"effect"`   // permit | deny | require-approval
	Reasons      string `json:"reasons"`
	RequestID    string `json:"request_id,omitempty"`
	CredentialID string `json:"credential_id,omitempty"`
	PIISealed    bool   `json:"pii_sealed"`
	DecidedAt    string `json:"decided_at"`
}

// admissionStore is the persistence port for admission applications. memAdmissionStore (in-memory) and
// pgAdmissionStore (PostgreSQL) satisfy it.
type admissionStore interface {
	Record(AdmissionApplication) error
	Get(id string) (AdmissionApplication, bool)
	List() []AdmissionApplication
}

// memAdmissionStore is the in-memory applications register (credential-free demo).
type memAdmissionStore struct {
	mu   sync.Mutex
	apps map[string]AdmissionApplication
	seq  []string
}

func newMemAdmissionStore() *memAdmissionStore {
	return &memAdmissionStore{apps: map[string]AdmissionApplication{}}
}

func (s *memAdmissionStore) Record(a AdmissionApplication) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, ok := s.apps[a.ID]; !ok {
		s.seq = append(s.seq, a.ID)
	}
	s.apps[a.ID] = a
	return nil
}

func (s *memAdmissionStore) Get(id string) (AdmissionApplication, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	a, ok := s.apps[id]
	return a, ok
}

func (s *memAdmissionStore) List() []AdmissionApplication {
	s.mu.Lock()
	defer s.mu.Unlock()
	out := make([]AdmissionApplication, 0, len(s.seq))
	for _, id := range s.seq {
		out = append(out, s.apps[id])
	}
	return out
}

var (
	admOnce  sync.Once
	admStore admissionStore
)

func admissionState() admissionStore {
	admOnce.Do(func() {
		if dsn := os.Getenv("DATABASE_URL"); dsn != "" {
			if pg, err := newPgAdmissionStore(dsn); err == nil {
				admStore = pg
				log.Printf("admission: using durable PostgreSQL applications store (DATABASE_URL set)")
			} else {
				log.Printf("admission: DATABASE_URL set but PostgreSQL unavailable (%v); using in-memory", err)
				admStore = newMemAdmissionStore()
			}
		} else {
			admStore = newMemAdmissionStore()
		}
	})
	return admStore
}

// recordAdmission persists the durable application record for a terminal admission outcome (best-effort: a
// persistence error must not change the decision already returned to the caller, but it is logged).
func (p *Platform) recordAdmission(req AdmissionRequest, res AdmissionResult) {
	if req.ApplicantID == "" {
		return // never persist an id-less application (avoids primary-key collisions on a malformed request)
	}
	app := AdmissionApplication{
		ID: req.ApplicantID, Category: req.Category, Age: req.ApplicantAge, Tenant: req.Tenant,
		Region: string(req.Region), Decision: req.Decision, Stage: res.Stage, Effect: res.Effect,
		Reasons: strings.Join(res.Reasons, ","), RequestID: res.RequestID, PIISealed: res.PIIEnvelope,
		DecidedAt: p.now(),
	}
	if res.Credential != nil {
		app.CredentialID = res.Credential.Signed.Credential.ID
	}
	if err := admissionState().Record(app); err != nil {
		log.Printf("admission: persist application %s: %v", req.ApplicantID, err)
	}
}

// AdmissionApplicationRecord returns one persisted application.
func (p *Platform) AdmissionApplicationRecord(id string) (AdmissionApplication, bool) {
	return admissionState().Get(id)
}

// AdmissionDashboard is the durable applications operating picture (optionally filtered by tenant prefix).
type AdmissionDashboard struct {
	Tenant       string                 `json:"tenant"`
	Total        int                    `json:"total"`
	ByStage      map[string]int         `json:"by_stage"`
	ByCategory   map[string]int         `json:"by_category"`
	Admitted     int                    `json:"admitted"`
	PendingRevw  int                    `json:"pending_review"`
	Applications []AdmissionApplication `json:"applications"`
}

// AdmissionDashboard rolls up the persisted applications. A non-empty tenant filters by tenant prefix (e.g.
// "TN/Chennai" or "TN/").
func (p *Platform) AdmissionDashboard(tenant string) AdmissionDashboard {
	d := AdmissionDashboard{Tenant: tenant, ByStage: map[string]int{}, ByCategory: map[string]int{}}
	for _, a := range admissionState().List() {
		if tenant != "" && !strings.HasPrefix(a.Tenant, tenant) {
			continue
		}
		d.Total++
		d.ByStage[a.Stage]++
		d.ByCategory[a.Category]++
		if a.Stage == "admitted" {
			d.Admitted++
		}
		if a.Stage == "pending-approval" {
			d.PendingRevw++
		}
		d.Applications = append(d.Applications, a)
	}
	sort.Slice(d.Applications, func(i, j int) bool { return d.Applications[i].ID < d.Applications[j].ID })
	return d
}
