// Package civic is the L12 Citizen & Civic layer: the public-facing surface of the platform — PII-suppressed
// public dashboards, an RTI request register with the statutory clock, a grievance tracker, and an open-data
// (CKAN-style) dataset catalogue (CC-SPEC-001 §L12; Synthesis "a Citizen and Civic Layer for public
// dashboards, RTI surface, grievance redress and transparency"). The defining rule is that nothing personal
// leaves this layer: institutional aggregates are published as-is, and any person-level cell is k-anonymity
// suppressed below a threshold. Deterministic; injectable clock.
package civic

import (
	"bytes"
	"encoding/csv"
	"sort"
	"strconv"
	"time"

	"github.com/vasa-eos-se-tn/platform/population"
)

// ── Public dashboards (PII-suppressed) ──

// PublicDashboard holds only non-personal institutional aggregates, safe to publish openly.
type PublicDashboard struct {
	Districts     int            `json:"districts"`
	Blocks        int            `json:"blocks"`
	Clusters      int            `json:"clusters"`
	Schools       int            `json:"schools"`
	ManagementMix map[string]int `json:"management_mix"`
	PIISuppressed bool           `json:"pii_suppressed"` // always true — no person-level data is published here
}

// Dashboard builds the public institutional dashboard from the estate. It contains no personal data.
func Dashboard(tree population.Tree) PublicDashboard {
	mix := map[string]int{}
	districts := map[string]bool{}
	for _, s := range tree.Schools {
		mix[s.Management]++
	}
	for _, b := range tree.Blocks {
		districts[b.District] = true
	}
	return PublicDashboard{
		Districts: len(districts), Blocks: len(tree.Blocks), Clusters: len(tree.Clusters),
		Schools: len(tree.Schools), ManagementMix: mix, PIISuppressed: true,
	}
}

// SuppressSmallCells applies k-anonymity to a person-level aggregate: any cell with a count below k is
// suppressed (set to 0 and listed), so a published statistic can never single out a small group.
func SuppressSmallCells(cells map[string]int, k int) (published map[string]int, suppressed []string) {
	published = map[string]int{}
	for key, n := range cells {
		if n < k {
			suppressed = append(suppressed, key)
			continue
		}
		published[key] = n
	}
	sort.Strings(suppressed)
	return published, suppressed
}

// ── RTI register ──

// RTIStatus is the lifecycle of a Right-to-Information request.
type RTIStatus string

const (
	RTIFiled        RTIStatus = "filed"
	RTIAcknowledged RTIStatus = "acknowledged"
	RTIAnswered     RTIStatus = "answered"
	RTIAppealed     RTIStatus = "appealed"
)

// RTIStatutoryDays is the RTI Act §7 response window (30 days).
const RTIStatutoryDays = 30

// RTIRequest is one citizen RTI request.
type RTIRequest struct {
	ID       string    `json:"id"`
	Subject  string    `json:"subject"`
	FiledBy  string    `json:"filed_by"`
	Filed    time.Time `json:"-"`
	FiledStr string    `json:"filed_at"`
	Status   RTIStatus `json:"status"`
	Answer   string    `json:"answer,omitempty"`
}

// ── Grievance tracker ──

// GrievanceStatus is the lifecycle of a grievance.
type GrievanceStatus string

const (
	GrvOpen     GrievanceStatus = "open"
	GrvRouted   GrievanceStatus = "routed"
	GrvResolved GrievanceStatus = "resolved"
)

// Grievance is one citizen grievance, routed through the governance tiers.
type Grievance struct {
	ID       string          `json:"id"`
	Subject  string          `json:"subject"`
	FiledBy  string          `json:"filed_by"`
	Tier     string          `json:"tier"` // the governance tier handling it
	Status   GrievanceStatus `json:"status"`
	FiledStr string          `json:"filed_at"`
}

// Registry is the stateful civic register (RTI + grievances).
type Registry struct {
	rti        map[string]*RTIRequest
	grievances map[string]*Grievance
	now        func() time.Time
}

// New builds a civic registry. now defaults to time.Now (UTC).
func New(now func() time.Time) *Registry {
	if now == nil {
		now = func() time.Time { return time.Now().UTC() }
	}
	return &Registry{rti: map[string]*RTIRequest{}, grievances: map[string]*Grievance{}, now: now}
}

// FileRTI files a new RTI request.
func (r *Registry) FileRTI(id, subject, by string) RTIRequest {
	t := r.now().UTC()
	req := &RTIRequest{ID: id, Subject: subject, FiledBy: by, Filed: t, FiledStr: t.Format(time.RFC3339), Status: RTIFiled}
	r.rti[id] = req
	return *req
}

// AcknowledgeRTI records that a request has been acknowledged by the Public Information Officer (the statutory
// clock keeps running until it is answered). ok is false if the id is unknown or already answered.
func (r *Registry) AcknowledgeRTI(id string) (RTIRequest, bool) {
	req, ok := r.rti[id]
	if !ok || req.Status == RTIAnswered {
		return RTIRequest{}, false
	}
	req.Status = RTIAcknowledged
	return *req, true
}

// AnswerRTI records an answer; ok is false if the id is unknown.
func (r *Registry) AnswerRTI(id, answer string) (RTIRequest, bool) {
	req, ok := r.rti[id]
	if !ok {
		return RTIRequest{}, false
	}
	req.Status, req.Answer = RTIAnswered, answer
	return *req, true
}

// RTIOverdue reports whether a request has breached the 30-day statutory window without an answer.
func (r *Registry) RTIOverdue(id string) bool {
	req, ok := r.rti[id]
	if !ok || req.Status == RTIAnswered {
		return false
	}
	return r.now().UTC().Sub(req.Filed) > RTIStatutoryDays*24*time.Hour
}

// GetRTI returns a single RTI request and whether it is past the statutory window.
func (r *Registry) GetRTI(id string) (RTIRequest, bool, bool) {
	req, ok := r.rti[id]
	if !ok {
		return RTIRequest{}, false, false
	}
	return *req, true, r.RTIOverdue(id)
}

// RTIRequests returns every RTI request, sorted by id.
func (r *Registry) RTIRequests() []RTIRequest {
	out := make([]RTIRequest, 0, len(r.rti))
	for _, req := range r.rti {
		out = append(out, *req)
	}
	sort.Slice(out, func(i, j int) bool { return out[i].ID < out[j].ID })
	return out
}

// FileGrievance files a grievance at a governance tier.
func (r *Registry) FileGrievance(id, subject, by, tier string) Grievance {
	g := &Grievance{ID: id, Subject: subject, FiledBy: by, Tier: tier, Status: GrvOpen, FiledStr: r.now().UTC().Format(time.RFC3339)}
	r.grievances[id] = g
	return *g
}

// GrievancesBy returns every grievance filed by a given citizen/principal, sorted by id.
func (r *Registry) GrievancesBy(filer string) []Grievance {
	var out []Grievance
	for _, g := range r.grievances {
		if g.FiledBy == filer {
			out = append(out, *g)
		}
	}
	sort.Slice(out, func(i, j int) bool { return out[i].ID < out[j].ID })
	return out
}

// ResolveGrievance marks a grievance resolved; ok is false if unknown.
func (r *Registry) ResolveGrievance(id string) (Grievance, bool) {
	g, ok := r.grievances[id]
	if !ok {
		return Grievance{}, false
	}
	g.Status = GrvResolved
	return *g, true
}

// ── Open data (CKAN-style) ──

// Dataset is one publishable open-data dataset (non-personal only).
type Dataset struct {
	ID      string `json:"id"`
	Title   string `json:"title"`
	Format  string `json:"format"`
	PIIFree bool   `json:"pii_free"`
}

// OpenDatasets returns the catalogue of publishable, non-personal datasets.
func OpenDatasets() []Dataset {
	return []Dataset{
		{"schools-by-district", "Schools by district + management category", "CSV/JSON", true},
		{"schools-by-type", "Schools by level × management category", "CSV/JSON", true},
		{"enrolment-aggregates", "Enrolment aggregates (k-anonymity suppressed)", "CSV/JSON", true},
		{"scheme-coverage", "Welfare-scheme coverage by district", "CSV/JSON", true},
		{"infrastructure-index", "School-infrastructure index by block", "CSV/JSON", true},
		{"grievance-stats", "Grievance volumes + resolution rates (aggregate)", "CSV/JSON", true},
		{"quality-index", "TN School Education Quality Index (disaggregated)", "CSV/JSON", true},
	}
}

// writeCSV renders rows to a CSV string (RFC 4180, deterministic).
func writeCSV(header []string, rows [][]string) string {
	var b bytes.Buffer
	w := csv.NewWriter(&b)
	_ = w.Write(header)
	for _, r := range rows {
		_ = w.Write(r)
	}
	w.Flush()
	return b.String()
}

// SchoolsByDistrictCSV is the open-data export of the institutional estate: schools per district by management
// category. Non-personal — safe to publish openly.
func SchoolsByDistrictCSV(tree population.Tree) string {
	// district → management → count.
	byDistrict := map[string]map[string]int{}
	for _, s := range tree.Schools {
		if byDistrict[s.District] == nil {
			byDistrict[s.District] = map[string]int{}
		}
		byDistrict[s.District][s.Management]++
	}
	districts := make([]string, 0, len(byDistrict))
	for d := range byDistrict {
		districts = append(districts, d)
	}
	sort.Strings(districts)
	cats := []string{"Government", "Aided", "Matriculation", "Private-CBSE"}
	rows := make([][]string, 0, len(districts))
	for _, d := range districts {
		m := byDistrict[d]
		total := 0
		for _, n := range m {
			total += n
		}
		row := []string{d, strconv.Itoa(total)}
		for _, c := range cats {
			row = append(row, strconv.Itoa(m[c]))
		}
		rows = append(rows, row)
	}
	header := append([]string{"district", "schools"}, []string{"government", "aided", "matriculation", "private_cbse"}...)
	return writeCSV(header, rows)
}

// SchoolsByTypeCSV is the open-data export of the school taxonomy: the count of schools per (level ×
// management) cross-tab. Non-personal — safe to publish openly.
func SchoolsByTypeCSV(tree population.Tree) string {
	// level → management → count.
	byType := map[string]map[string]int{}
	mgmts := map[string]bool{}
	for _, s := range tree.Schools {
		if byType[s.Level] == nil {
			byType[s.Level] = map[string]int{}
		}
		byType[s.Level][s.Management]++
		mgmts[s.Management] = true
	}
	levels := make([]string, 0, len(byType))
	for l := range byType {
		levels = append(levels, l)
	}
	sort.Strings(levels)
	cats := make([]string, 0, len(mgmts))
	for m := range mgmts {
		cats = append(cats, m)
	}
	sort.Strings(cats)
	rows := make([][]string, 0, len(levels))
	for _, l := range levels {
		total := 0
		for _, n := range byType[l] {
			total += n
		}
		row := []string{l, strconv.Itoa(total)}
		for _, c := range cats {
			row = append(row, strconv.Itoa(byType[l][c]))
		}
		rows = append(rows, row)
	}
	return writeCSV(append([]string{"level", "schools"}, cats...), rows)
}

// EnrolmentCSV is the open-data export of a k-anonymity-suppressed person-level enrolment statistic: only
// published (>= k) cells appear; suppressed cells are listed in a trailing comment row, never with a count.
func EnrolmentCSV(dimension string, published map[string]int, suppressed []string) string {
	keys := make([]string, 0, len(published))
	for k := range published {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	rows := make([][]string, 0, len(keys)+1)
	for _, k := range keys {
		rows = append(rows, []string{k, strconv.Itoa(published[k])})
	}
	// record suppression transparently (count withheld, not zeroed-and-shown).
	for _, s := range suppressed {
		rows = append(rows, []string{s, "suppressed(<k)"})
	}
	return writeCSV([]string{dimension, "enrolment"}, rows)
}

// Summary is the civic-layer roll-up.
type Summary struct {
	RTIOpen       int `json:"rti_open"`
	RTIAnswered   int `json:"rti_answered"`
	RTIOverdue    int `json:"rti_overdue"`
	GrievOpen     int `json:"grievances_open"`
	GrievResolved int `json:"grievances_resolved"`
	OpenDatasets  int `json:"open_datasets"`
}

// Summarise rolls up the civic register.
func (r *Registry) Summarise() Summary {
	s := Summary{OpenDatasets: len(OpenDatasets())}
	for id, req := range r.rti {
		if req.Status == RTIAnswered {
			s.RTIAnswered++
		} else {
			s.RTIOpen++
		}
		if r.RTIOverdue(id) {
			s.RTIOverdue++
		}
	}
	for _, g := range r.grievances {
		if g.Status == GrvResolved {
			s.GrievResolved++
		} else {
			s.GrievOpen++
		}
	}
	return s
}
