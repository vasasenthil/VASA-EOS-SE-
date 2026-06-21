// Package exams is the L6 Examinations & Results service: the lifecycle AFTER an examination is scheduled on
// the academic calendar — a marks sheet per exam that teachers fill (open), a head teacher locks and submits
// for moderation, and that is moderated to publication or returned for correction. Grades and pass/fail are
// computed deterministically (TN marks bands) and the sheet rolls up to result analytics. Pure + stdlib-only.
package exams

import (
	"errors"
	"sort"
)

// PassPercent is the TN minimum pass mark (percent).
const PassPercent = 35

// band maps a percent floor to its grade (TN-style 10-point-ish bands).
type band struct {
	min   int
	grade string
}

func bands() []band {
	return []band{
		{91, "A1"}, {81, "A2"}, {71, "B1"}, {61, "B2"},
		{51, "C1"}, {41, "C2"}, {35, "D"}, {0, "E"},
	}
}

// GradeFor returns the grade for marks out of max (E is the failing band).
func GradeFor(marks, max int) string {
	if max <= 0 {
		return "E"
	}
	pct := marks * 100 / max
	for _, b := range bands() {
		if pct >= b.min {
			return b.grade
		}
	}
	return "E"
}

// Passed reports whether marks out of max clears the pass percent.
func Passed(marks, max int) bool {
	if max <= 0 {
		return false
	}
	return marks*100/max >= PassPercent
}

// Result is one student's outcome on a sheet. Grade/Pass are computed when the sheet is submitted (locked).
type Result struct {
	StudentID string `json:"student_id"` // APAAR-anchored learner id
	Marks     int    `json:"marks"`
	Grade     string `json:"grade,omitempty"`
	Pass      bool   `json:"pass"`
}

// Sheet lifecycle statuses.
const (
	Open      = "open"      // teachers entering marks
	Submitted = "submitted" // locked, awaiting moderation
	Published = "published" // results live
	Returned  = "returned"  // sent back for correction
)

// Sheet is the marks sheet for one examination (a subject/class at an org unit). It is CRUD-addressable on its
// per-student results and moves open → submitted → published / returned.
type Sheet struct {
	ExamID   string `json:"exam_id"`
	OrgUnit  string `json:"org_unit"` // the school (T6) the exam belongs to
	Subject  string `json:"subject"`
	Class    string `json:"class"`
	MaxMarks int    `json:"max_marks"`
	Status   string `json:"status"`
	results  map[string]Result
	order    []string
}

// NewSheet creates an open marks sheet.
func NewSheet(examID, org, subject, class string, max int) *Sheet {
	return &Sheet{ExamID: examID, OrgUnit: org, Subject: subject, Class: class, MaxMarks: max, Status: Open, results: map[string]Result{}}
}

// Enter records or updates a student's marks. Allowed only while the sheet is open; marks must be in range.
func (s *Sheet) Enter(studentID string, marks int) error {
	if s.Status != Open && s.Status != Returned {
		return errors.New("exams: marks can only be entered while the sheet is open or returned for correction")
	}
	if studentID == "" {
		return errors.New("exams: student id is required")
	}
	if marks < 0 || marks > s.MaxMarks {
		return errors.New("exams: marks out of range")
	}
	if _, ok := s.results[studentID]; !ok {
		s.order = append(s.order, studentID)
	}
	s.results[studentID] = Result{StudentID: studentID, Marks: marks}
	return nil
}

// Get returns a student's result.
func (s *Sheet) Get(studentID string) (Result, bool) { r, ok := s.results[studentID]; return r, ok }

// Count returns the number of results entered.
func (s *Sheet) Count() int { return len(s.results) }

// Submit locks the sheet (open → submitted) and computes each result's grade + pass flag. At least one mark
// must be entered.
func (s *Sheet) Submit() error {
	if s.Status != Open && s.Status != Returned {
		return errors.New("exams: only an open or returned sheet can be submitted")
	}
	if len(s.results) == 0 {
		return errors.New("exams: no marks entered")
	}
	for id, r := range s.results {
		r.Grade = GradeFor(r.Marks, s.MaxMarks)
		r.Pass = Passed(r.Marks, s.MaxMarks)
		s.results[id] = r
	}
	s.Status = Submitted
	return nil
}

// Moderate publishes (approve) or returns (reject) a submitted sheet.
func (s *Sheet) Moderate(approve bool) error {
	if s.Status != Submitted {
		return errors.New("exams: only a submitted sheet can be moderated")
	}
	if approve {
		s.Status = Published
	} else {
		s.Status = Returned
	}
	return nil
}

// Results returns the per-student results in entry order.
func (s *Sheet) Results() []Result {
	out := make([]Result, 0, len(s.order))
	for _, id := range s.order {
		out = append(out, s.results[id])
	}
	return out
}

// Analytics is the result roll-up for a sheet.
type Analytics struct {
	Entered   int            `json:"entered"`
	Pass      int            `json:"pass"`
	Fail      int            `json:"fail"`
	PassPct   float64        `json:"pass_pct"`
	Mean      float64        `json:"mean_marks"`
	Highest   int            `json:"highest"`
	GradeDist map[string]int `json:"grade_distribution"`
}

// Analytics computes the result distribution for the sheet (grades are valid only once submitted).
func (s *Sheet) Analytics() Analytics {
	a := Analytics{GradeDist: map[string]int{}}
	a.Entered = len(s.results)
	if a.Entered == 0 {
		return a
	}
	total := 0
	for _, r := range s.results {
		total += r.Marks
		if r.Marks > a.Highest {
			a.Highest = r.Marks
		}
		grade := r.Grade
		if grade == "" {
			grade = GradeFor(r.Marks, s.MaxMarks)
		}
		a.GradeDist[grade]++
		if Passed(r.Marks, s.MaxMarks) {
			a.Pass++
		} else {
			a.Fail++
		}
	}
	a.Mean = float64(total) / float64(a.Entered)
	a.PassPct = float64(a.Pass) * 100 / float64(a.Entered)
	return a
}

// Register is the collection of marks sheets, keyed by exam id.
type Register struct {
	sheets map[string]*Sheet
	order  []string
}

// NewRegister returns an empty register.
func NewRegister() *Register { return &Register{sheets: map[string]*Sheet{}} }

// Add inserts a sheet (keyed by ExamID). A duplicate exam id is rejected.
func (r *Register) Add(s *Sheet) error {
	if _, ok := r.sheets[s.ExamID]; ok {
		return errors.New("exams: duplicate exam id " + s.ExamID)
	}
	r.sheets[s.ExamID] = s
	r.order = append(r.order, s.ExamID)
	return nil
}

// Get returns a sheet by exam id.
func (r *Register) Get(examID string) (*Sheet, bool) { s, ok := r.sheets[examID]; return s, ok }

// Sheets returns all sheets in insertion order.
func (r *Register) Sheets() []*Sheet {
	out := make([]*Sheet, 0, len(r.order))
	for _, id := range r.order {
		out = append(out, r.sheets[id])
	}
	return out
}

// SheetSummary is the per-sheet line for a dashboard.
type SheetSummary struct {
	ExamID  string    `json:"exam_id"`
	OrgUnit string    `json:"org_unit"`
	Subject string    `json:"subject"`
	Class   string    `json:"class"`
	Status  string    `json:"status"`
	Stats   Analytics `json:"stats"`
}

// Summarise returns a per-sheet summary for the given sheets, sorted by exam id for stability.
func Summarise(sheets []*Sheet) []SheetSummary {
	out := make([]SheetSummary, 0, len(sheets))
	for _, s := range sheets {
		out = append(out, SheetSummary{ExamID: s.ExamID, OrgUnit: s.OrgUnit, Subject: s.Subject, Class: s.Class, Status: s.Status, Stats: s.Analytics()})
	}
	sort.Slice(out, func(i, j int) bool { return out[i].ExamID < out[j].ExamID })
	return out
}
