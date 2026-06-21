package integration

import (
	"errors"
	"fmt"
	"hash/fnv"
	"log"
	"os"
	"sync"

	"github.com/vasa-eos-se-tn/platform/directory"
	"github.com/vasa-eos-se-tn/platform/exams"
)

// The Examinations & Results service is the lifecycle AFTER an exam is scheduled on the academic calendar: a
// marks sheet per exam that teachers fill, a head teacher submits for moderation, and that is moderated to
// publication. Crucially, every mutation is gated by the SAME unified five-model PDP the platform uses
// everywhere — marks entry requires the teaching-cadre ABAC attribute AND jurisdiction (ReBAC) over the school;
// moderation requires the head teacher's authority (write:school) — so the access models are load-bearing here,
// not decorative.
var (
	examOnce sync.Once
	examReg  examStore
)

// examState returns the marks-sheet store. When DATABASE_URL is set it is the DURABLE PostgreSQL store
// (results survive restarts); otherwise it is the in-memory register (credential-free demo).
func examState() examStore {
	examOnce.Do(func() {
		if dsn := os.Getenv("DATABASE_URL"); dsn != "" {
			if pg, err := newPgExamStore(dsn); err == nil {
				examReg = pg
				log.Printf("exams: using durable PostgreSQL store (DATABASE_URL set)")
			} else {
				log.Printf("exams: DATABASE_URL set but PostgreSQL unavailable (%v); using in-memory", err)
				examReg = exams.NewRegister()
			}
		} else {
			examReg = exams.NewRegister()
		}
		seedExams(examReg)
	})
	return examReg
}

// seedExams plants three marks sheets at a real Chennai school across the lifecycle: an OPEN sheet still being
// filled, a SUBMITTED sheet awaiting the head teacher's moderation, and a PUBLISHED sheet. Students and marks
// are synthetic + deterministic (SYN-STU ids), never real PII.
func seedExams(r examStore) {
	school := tenancyLeafUnder("TN-DIST-Chennai")
	if school == "" {
		school = "33000000000"
	}
	cohort := func(n int) []string {
		out := make([]string, n)
		for i := 0; i < n; i++ {
			out[i] = fmt.Sprintf("SYN-STU-%03d", i+1)
		}
		return out
	}
	mark := func(seed, student string) int {
		h := fnv.New32a()
		h.Write([]byte(seed + student))
		return int(h.Sum32() % 101) // 0..100, deterministic
	}
	// OPEN — Term I Mathematics, partially entered.
	open := exams.NewSheet("EXM-CHN-MATHS-T1", school, "Mathematics", "Grade 10", 100)
	for _, s := range cohort(30) {
		open.Enter(s, mark("maths", s))
	}
	r.Add(open)
	// SUBMITTED — Science, locked, awaiting moderation.
	sub := exams.NewSheet("EXM-CHN-SCI-T1", school, "Science", "Grade 10", 100)
	for _, s := range cohort(30) {
		sub.Enter(s, mark("science", s))
	}
	sub.Submit()
	r.Add(sub)
	// PUBLISHED — Tamil, moderated and live.
	pub := exams.NewSheet("EXM-CHN-TAM-T1", school, "Tamil", "Grade 10", 100)
	for _, s := range cohort(30) {
		pub.Enter(s, mark("tamil", s))
	}
	pub.Submit()
	pub.Moderate(true)
	r.Add(pub)
}

// gateExam runs the unified PDP for an actor against an action on the sheet's school. Returns the deny reason
// (empty if permitted) so the caller can surface exactly why a marks action was refused.
func (p *Platform) gateExam(actorUserID, action, school string) (bool, string) {
	dec, _, ok := p.AccessExplain(actorUserID, action, directory.Resource{OrgUnit: school}, directory.Context{})
	if !ok {
		return false, "unknown actor " + actorUserID
	}
	if !dec.Permitted() {
		return false, dec.DecidingModel + ": " + dec.Reason
	}
	return true, ""
}

// EnterMarks records a student's marks — gated by write:assessment (teaching-cadre ABAC + jurisdiction ReBAC).
func (p *Platform) EnterMarks(examID, studentID string, marks int, actorUserID string) error {
	sh, ok := examState().Get(examID)
	if !ok {
		return errors.New("exams: sheet not found")
	}
	if okGate, why := p.gateExam(actorUserID, "write:assessment", sh.OrgUnit); !okGate {
		p.appendAudit("user:"+actorUserID, "exams.marks.denied", examID, "deny", why)
		return errors.New("exams: not authorised — " + why)
	}
	if err := examState().Enter(examID, studentID, marks); err != nil {
		return err
	}
	p.appendAudit("user:"+actorUserID, "exams.marks.enter", examID, "executed", studentID)
	return nil
}

// SubmitMarksSheet locks an open sheet and computes grades — gated by write:assessment.
func (p *Platform) SubmitMarksSheet(examID, actorUserID string) error {
	sh, ok := examState().Get(examID)
	if !ok {
		return errors.New("exams: sheet not found")
	}
	if okGate, why := p.gateExam(actorUserID, "write:assessment", sh.OrgUnit); !okGate {
		p.appendAudit("user:"+actorUserID, "exams.submit.denied", examID, "deny", why)
		return errors.New("exams: not authorised — " + why)
	}
	if err := examState().Submit(examID); err != nil {
		return err
	}
	updated, _ := examState().Get(examID)
	p.appendAudit("user:"+actorUserID, "exams.submit", examID, "executed", updated.Status)
	return nil
}

// ModerateMarksSheet publishes or returns a submitted sheet — gated by write:school (the head teacher's
// authority; a plain teacher who can enter marks cannot moderate them — separation of duties).
func (p *Platform) ModerateMarksSheet(examID string, approve bool, actorUserID string) error {
	sh, ok := examState().Get(examID)
	if !ok {
		return errors.New("exams: sheet not found")
	}
	if okGate, why := p.gateExam(actorUserID, "write:school", sh.OrgUnit); !okGate {
		p.appendAudit("user:"+actorUserID, "exams.moderate.denied", examID, "deny", why)
		return errors.New("exams: not authorised to moderate — " + why)
	}
	if err := examState().Moderate(examID, approve); err != nil {
		return err
	}
	effect := "published"
	if !approve {
		effect = "returned"
	}
	updated, _ := examState().Get(examID)
	p.appendAudit("user:"+actorUserID, "exams.moderate", examID, effect, updated.Status)
	return nil
}

// ExamSheetDetail is a single sheet with its results and analytics.
type ExamSheetDetail struct {
	ExamID    string          `json:"exam_id"`
	OrgUnit   string          `json:"org_unit"`
	Subject   string          `json:"subject"`
	Class     string          `json:"class"`
	Status    string          `json:"status"`
	Results   []exams.Result  `json:"results"`
	Stats     exams.Analytics `json:"stats"`
	Synthetic bool            `json:"synthetic"`
}

// ExamSheet returns a single sheet detail.
func (p *Platform) ExamSheet(examID string) (ExamSheetDetail, bool) {
	sh, ok := examState().Get(examID)
	if !ok {
		return ExamSheetDetail{}, false
	}
	return ExamSheetDetail{
		ExamID: sh.ExamID, OrgUnit: sh.OrgUnit, Subject: sh.Subject, Class: sh.Class,
		Status: sh.Status, Results: sh.Results(), Stats: sh.Analytics(), Synthetic: true,
	}, true
}

// ExamResultsDashboard is the jurisdiction-scoped results operating picture: every marks sheet the tenant node
// governs, with per-sheet status + analytics and an aggregate pass picture. Downward-governance scoped.
type ExamResultsDashboard struct {
	Scope           string               `json:"scope"`
	Sheets          int                  `json:"sheets"`
	ByStatus        map[string]int       `json:"by_status"`
	ResultsRecorded int                  `json:"results_recorded"`
	OverallPass     int                  `json:"overall_pass"`
	OverallPct      float64              `json:"overall_pass_pct"`
	PerSheet        []exams.SheetSummary `json:"per_sheet"`
	Synthetic       bool                 `json:"synthetic"`
}

// ExamResultsDashboard rolls up the sheets a tenant node governs.
func (p *Platform) ExamResultsDashboard(scope string) ExamResultsDashboard {
	d := ExamResultsDashboard{Scope: scope, ByStatus: map[string]int{}, Synthetic: true}
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return d
	}
	var governed []*exams.Sheet
	for _, sh := range examState().Sheets() {
		if h.Governs(scope, sh.OrgUnit) {
			governed = append(governed, sh)
		}
	}
	totalResults, totalPass := 0, 0
	for _, sh := range governed {
		d.ByStatus[sh.Status]++
		a := sh.Analytics()
		totalResults += a.Entered
		totalPass += a.Pass
	}
	d.Sheets = len(governed)
	d.ResultsRecorded = totalResults
	d.OverallPass = totalPass
	if totalResults > 0 {
		d.OverallPct = float64(totalPass) * 100 / float64(totalResults)
	}
	d.PerSheet = exams.Summarise(governed)
	return d
}
