package integration

import (
	"errors"
	"fmt"
	"log"
	"os"
	"sync"
)

// Native AI Language Lab is an L7/L8 multilingual vertical: it operationalises the language Native-AI pillar
// (Bhashini-assisted NLU/NLG across the 22 Eighth-Schedule languages) as a durable translation-and-publishing
// workflow. A content item (curriculum / notice / circular / parent-comms) is translated into a target language
// through requested → translated → reviewed → published, optionally with a machine (Bhashini) first draft. It is
// durable, audited, and enforces a hard QUALITY GATE server-side:
//   - A translation cannot be PUBLISHED without being REVIEWED — machine output never reaches parents unreviewed.
// The target language must be a valid Eighth-Schedule language, and source ≠ target. Downward-governance scoped.
// Synthetic ids only, never real PII.

// Translation-job status.
const (
	TJRequested  = "requested"
	TJTranslated = "translated"
	TJReviewed   = "reviewed"
	TJPublished  = "published"
	TJRejected   = "rejected"
)

// eighthSchedule is the set of accepted language codes: English (link language) + the 22 Eighth-Schedule languages.
var eighthSchedule = map[string]string{
	"en": "English", "ta": "Tamil", "hi": "Hindi", "te": "Telugu", "kn": "Kannada", "ml": "Malayalam",
	"ur": "Urdu", "as": "Assamese", "bn": "Bengali", "brx": "Bodo", "doi": "Dogri", "gu": "Gujarati",
	"ks": "Kashmiri", "kok": "Konkani", "mai": "Maithili", "mni": "Manipuri", "mr": "Marathi", "ne": "Nepali",
	"or": "Odia", "pa": "Punjabi", "sa": "Sanskrit", "sat": "Santali", "sd": "Sindhi",
}

func validLang(code string) bool { _, ok := eighthSchedule[code]; return ok }

func validTJDomain(d string) bool {
	switch d {
	case "curriculum", "notice", "circular", "parent-comms", "exam":
		return true
	}
	return false
}

// TranslationJob is one content item being translated into a target language.
type TranslationJob struct {
	ID              string `json:"id"`
	OrgUnit         string `json:"org_unit"`
	Title           string `json:"title"`
	Domain          string `json:"domain"` // curriculum | notice | circular | parent-comms | exam
	SourceLang      string `json:"source_lang"`
	TargetLang      string `json:"target_lang"`
	Status          string `json:"status"`
	MachineAssisted bool   `json:"machine_assisted"` // Bhashini first-draft
	Translator      string `json:"translator,omitempty"`
	Reviewer        string `json:"reviewer,omitempty"`
	Note            string `json:"note,omitempty"`
	CreatedOn       string `json:"created_on"`
	UpdatedAt       string `json:"updated_at"`
}

// Validate checks a job's required fields + the language rules.
func (j TranslationJob) Validate() error {
	if j.ID == "" || j.OrgUnit == "" {
		return errors.New("language-lab: id and org_unit are required")
	}
	if j.Title == "" {
		return errors.New("language-lab: a title is required")
	}
	if !validTJDomain(j.Domain) {
		return errors.New("language-lab: domain must be curriculum, notice, circular, parent-comms or exam")
	}
	if !validLang(j.SourceLang) || !validLang(j.TargetLang) {
		return errors.New("language-lab: source_lang and target_lang must be valid Eighth-Schedule language codes")
	}
	if j.SourceLang == j.TargetLang {
		return errors.New("language-lab: source_lang and target_lang must differ")
	}
	return nil
}

// applyTranslate moves a requested job to translated, recording the translator (and whether machine-assisted).
func applyTranslate(j TranslationJob, translator string, machineAssisted bool, now string) (TranslationJob, error) {
	if j.Status != TJRequested {
		return TranslationJob{}, fmt.Errorf("language-lab: only a requested job can be translated (is %s)", j.Status)
	}
	j.Status = TJTranslated
	j.Translator = translator
	j.MachineAssisted = machineAssisted
	j.UpdatedAt = now
	return j, nil
}

// applyReview moves a translated job to reviewed, recording the reviewer (the human quality gate).
func applyReview(j TranslationJob, reviewer, now string) (TranslationJob, error) {
	if j.Status != TJTranslated {
		return TranslationJob{}, fmt.Errorf("language-lab: only a translated job can be reviewed (is %s)", j.Status)
	}
	j.Status = TJReviewed
	j.Reviewer = reviewer
	j.UpdatedAt = now
	return j, nil
}

// applyPublish publishes a reviewed job — the QUALITY GATE: must be reviewed (a translated-but-unreviewed job is
// rejected, so machine output never reaches the public unreviewed).
func applyPublish(j TranslationJob, now string) (TranslationJob, error) {
	if j.Status == TJTranslated {
		return TranslationJob{}, errors.New("language-lab: cannot publish a translation that has not been reviewed")
	}
	if j.Status != TJReviewed {
		return TranslationJob{}, fmt.Errorf("language-lab: only a reviewed job can be published (is %s)", j.Status)
	}
	j.Status = TJPublished
	j.UpdatedAt = now
	return j, nil
}

// applyReject rejects a job that is not yet published.
func applyReject(j TranslationJob, note, now string) (TranslationJob, error) {
	if j.Status == TJPublished {
		return TranslationJob{}, errors.New("language-lab: a published translation cannot be rejected")
	}
	j.Status = TJRejected
	j.Note = note
	j.UpdatedAt = now
	return j, nil
}

type tjFilter struct{ OrgUnit, TargetLang, Status string }

func matchTJ(f tjFilter, j TranslationJob) bool {
	if f.OrgUnit != "" && j.OrgUnit != f.OrgUnit {
		return false
	}
	if f.TargetLang != "" && j.TargetLang != f.TargetLang {
		return false
	}
	if f.Status != "" && j.Status != f.Status {
		return false
	}
	return true
}

// tjStore is the persistence port. *memTJStore and *pgTJStore satisfy it.
type tjStore interface {
	Upsert(TranslationJob) (TranslationJob, error)
	Get(id string) (TranslationJob, bool)
	List(tjFilter) []TranslationJob
}

type memTJStore struct {
	mu sync.Mutex
	m  map[string]TranslationJob
}

func newMemTJStore() *memTJStore { return &memTJStore{m: map[string]TranslationJob{}} }

func (s *memTJStore) Upsert(j TranslationJob) (TranslationJob, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.m[j.ID] = j
	return j, nil
}

func (s *memTJStore) Get(id string) (TranslationJob, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	j, ok := s.m[id]
	return j, ok
}

func (s *memTJStore) List(f tjFilter) []TranslationJob {
	s.mu.Lock()
	defer s.mu.Unlock()
	out := make([]TranslationJob, 0, len(s.m))
	for _, j := range s.m {
		if matchTJ(f, j) {
			out = append(out, j)
		}
	}
	return out
}

var (
	tjOnce sync.Once
	tjBack tjStore
)

func tjState() tjStore {
	tjOnce.Do(func() {
		if dsn := os.Getenv("DATABASE_URL"); dsn != "" {
			if pg, err := newPgTJStore(dsn); err == nil {
				tjBack = pg
				log.Printf("language-lab: using durable PostgreSQL store (DATABASE_URL set)")
			} else {
				log.Printf("language-lab: DATABASE_URL set but PostgreSQL unavailable (%v); using in-memory", err)
				tjBack = newMemTJStore()
			}
		} else {
			tjBack = newMemTJStore()
		}
		seedLanguageLab(tjBack)
	})
	return tjBack
}

func tjNow() string { return "2026-06-25T00:00:00Z" }

// RequestTranslation records a new translation job (status requested). Audited.
func (p *Platform) RequestTranslation(j TranslationJob) (TranslationJob, error) {
	j.Status = TJRequested
	if j.CreatedOn == "" {
		j.CreatedOn = "2026-06-25"
	}
	j.UpdatedAt = tjNow()
	if err := j.Validate(); err != nil {
		p.appendAudit("language-officer", "languagelab.request.denied", j.OrgUnit, "deny", err.Error())
		return TranslationJob{}, err
	}
	out, err := tjState().Upsert(j)
	if err != nil {
		return TranslationJob{}, err
	}
	p.appendAudit("language-officer", "languagelab.request", j.ID, "executed", fmt.Sprintf("%s → %s (%s)", j.SourceLang, j.TargetLang, j.Domain))
	return out, nil
}

// AdvanceTranslation walks a job: translate (records translator + machine flag) | review (records reviewer) |
// publish (quality gate: must be reviewed) | reject. Audited.
func (p *Platform) AdvanceTranslation(id, action, actor string, machineAssisted bool, note string) (TranslationJob, error) {
	cur, ok := tjState().Get(id)
	if !ok {
		return TranslationJob{}, errors.New("language-lab: not found")
	}
	var (
		out TranslationJob
		err error
	)
	switch action {
	case "translate":
		out, err = applyTranslate(cur, actor, machineAssisted, tjNow())
	case "review":
		out, err = applyReview(cur, actor, tjNow())
	case "publish":
		out, err = applyPublish(cur, tjNow())
	case "reject":
		out, err = applyReject(cur, note, tjNow())
	default:
		return TranslationJob{}, errors.New("language-lab: action must be translate, review, publish or reject")
	}
	if err != nil {
		p.appendAudit("language-officer", "languagelab.advance.denied", id, "deny", err.Error())
		return TranslationJob{}, err
	}
	if _, err := tjState().Upsert(out); err != nil {
		return TranslationJob{}, err
	}
	p.appendAudit("language-officer", "languagelab.advance", id, "executed", action+"→"+out.Status)
	return out, nil
}

// TranslationRecord returns a single job by id.
func (p *Platform) TranslationRecord(id string) (TranslationJob, bool) { return tjState().Get(id) }

// LanguageLabDashboard is the jurisdiction-scoped multilingual picture: jobs by status/target-language, the
// published count, distinct languages covered (with published content), and the pending-review worklist.
type LanguageLabDashboard struct {
	Scope            string           `json:"scope"`
	Jobs             int              `json:"jobs"`
	ByStatus         map[string]int   `json:"by_status"`
	ByTargetLang     map[string]int   `json:"by_target_lang"`
	Published        int              `json:"published"`
	MachineAssisted  int              `json:"machine_assisted"`
	LanguagesCovered []string         `json:"languages_covered"`
	ReviewWorklist   []TranslationJob `json:"review_worklist,omitempty"`
	Synthetic        bool             `json:"synthetic"`
}

// LanguageLabDashboard rolls up translation jobs across the schools a tenant node governs (fail-closed for others).
func (p *Platform) LanguageLabDashboard(scopeOrg string) LanguageLabDashboard {
	d := LanguageLabDashboard{Scope: scopeOrg, ByStatus: map[string]int{}, ByTargetLang: map[string]int{}, Synthetic: true}
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return d
	}
	covered := map[string]bool{}
	for _, j := range tjState().List(tjFilter{}) {
		if !h.Governs(scopeOrg, j.OrgUnit) {
			continue
		}
		d.Jobs++
		d.ByStatus[j.Status]++
		d.ByTargetLang[j.TargetLang]++
		if j.MachineAssisted {
			d.MachineAssisted++
		}
		if j.Status == TJPublished {
			d.Published++
			covered[j.TargetLang] = true
		}
		if j.Status == TJTranslated {
			d.ReviewWorklist = append(d.ReviewWorklist, j)
		}
	}
	for code := range covered {
		d.LanguagesCovered = append(d.LanguagesCovered, code)
	}
	return d
}

// ScopedTranslations lists translation jobs a tenant node governs (optionally filtered by status).
func (p *Platform) ScopedTranslations(scopeOrg, status string) []TranslationJob {
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return nil
	}
	var out []TranslationJob
	for _, j := range tjState().List(tjFilter{Status: status}) {
		if h.Governs(scopeOrg, j.OrgUnit) {
			out = append(out, j)
		}
	}
	return out
}

// seedLanguageLab plants translation jobs across schools over more than one district: a published Tamil notice, a
// machine-assisted job awaiting review (so the quality gate is exercisable), and a requested job. Synthetic ids.
func seedLanguageLab(s tjStore) {
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
		// A published Tamil parent notice (en → ta), reviewed.
		pub := TranslationJob{
			ID: fmt.Sprintf("TJ-%s-01", tag), OrgUnit: school, Title: "Mid-term PTM notice", Domain: "parent-comms",
			SourceLang: "en", TargetLang: "ta", CreatedOn: "2026-06-10", UpdatedAt: tjNow(),
		}
		pub.Status = TJRequested
		if t, err := applyTranslate(pub, "SYN-TR-"+tag, true, tjNow()); err == nil {
			if rv, err := applyReview(t, "SYN-RV-"+tag, tjNow()); err == nil {
				if pp, err := applyPublish(rv, tjNow()); err == nil {
					pub = pp
				}
			}
		}
		s.Upsert(pub)

		// A machine-assisted Telugu circular AWAITING REVIEW (status translated) — exercises the quality gate.
		await := TranslationJob{
			ID: fmt.Sprintf("TJ-%s-02", tag), OrgUnit: school, Title: "Scholarship circular", Domain: "circular",
			SourceLang: "en", TargetLang: "te", CreatedOn: "2026-06-20", UpdatedAt: tjNow(),
		}
		await.Status = TJRequested
		if t, err := applyTranslate(await, "SYN-TR-"+tag, true, tjNow()); err == nil {
			await = t
		}
		s.Upsert(await)

		// A fresh Hindi request.
		req := TranslationJob{
			ID: fmt.Sprintf("TJ-%s-03", tag), OrgUnit: school, Title: "FLN worksheet pack", Domain: "curriculum",
			SourceLang: "en", TargetLang: "hi", CreatedOn: "2026-06-22", UpdatedAt: tjNow(), Status: TJRequested,
		}
		if err := req.Validate(); err == nil {
			s.Upsert(req)
		}
	}
}
