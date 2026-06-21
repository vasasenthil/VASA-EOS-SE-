package civic

import (
	"testing"
	"time"

	"github.com/vasa-eos-se-tn/platform/population"
)

func TestPublicDashboardIsPIIFree(t *testing.T) {
	d := Dashboard(population.BuildTree())
	if d.Schools != 69000 || d.Districts != 38 || d.Blocks != 385 || d.Clusters != 3800 {
		t.Fatalf("dashboard institutional aggregates wrong: %+v", d)
	}
	if !d.PIISuppressed {
		t.Fatal("the public dashboard must declare PII suppression")
	}
	total := 0
	for _, n := range d.ManagementMix {
		total += n
	}
	if total != d.Schools {
		t.Fatalf("management mix must cover every school: %d vs %d", total, d.Schools)
	}
}

func TestKAnonymitySuppression(t *testing.T) {
	cells := map[string]int{"big": 120, "edge": 4, "tiny": 1}
	pub, sup := SuppressSmallCells(cells, 5)
	if _, ok := pub["big"]; !ok {
		t.Fatal("a large cell must be published")
	}
	if _, ok := pub["edge"]; ok {
		t.Fatal("a sub-threshold cell must be suppressed")
	}
	if len(sup) != 2 {
		t.Fatalf("expected 2 suppressed cells, got %v", sup)
	}
}

func TestRTILifecycleAndStatutoryClock(t *testing.T) {
	cur := time.Date(2026, 6, 1, 0, 0, 0, 0, time.UTC)
	r := New(func() time.Time { return cur })
	r.FileRTI("RTI-1", "school sanitation data", "citizen-1")
	if r.RTIOverdue("RTI-1") {
		t.Fatal("a fresh RTI must not be overdue")
	}
	cur = cur.Add(31 * 24 * time.Hour) // past the 30-day window
	if !r.RTIOverdue("RTI-1") {
		t.Fatal("an unanswered RTI past 30 days must be overdue")
	}
	if _, ok := r.AnswerRTI("RTI-1", "published"); !ok {
		t.Fatal("answering a known RTI must succeed")
	}
	if r.RTIOverdue("RTI-1") {
		t.Fatal("an answered RTI is no longer overdue")
	}
}

func TestRTIAcknowledgeAndList(t *testing.T) {
	cur := time.Date(2026, 6, 1, 0, 0, 0, 0, time.UTC)
	r := New(func() time.Time { return cur })
	r.FileRTI("RTI-A", "infrastructure data", "citizen-a")
	ack, ok := r.AcknowledgeRTI("RTI-A")
	if !ok || ack.Status != RTIAcknowledged {
		t.Fatalf("acknowledging a filed RTI must move it to acknowledged: %+v ok=%v", ack, ok)
	}
	// acknowledging does not stop the statutory clock.
	cur = cur.Add(31 * 24 * time.Hour)
	if !r.RTIOverdue("RTI-A") {
		t.Fatal("an acknowledged-but-unanswered RTI past 30 days is still overdue")
	}
	got, found, overdue := r.GetRTI("RTI-A")
	if !found || !overdue || got.Status != RTIAcknowledged {
		t.Fatalf("GetRTI wrong: %+v found=%v overdue=%v", got, found, overdue)
	}
	if len(r.RTIRequests()) != 1 {
		t.Fatalf("expected 1 RTI in the register, got %d", len(r.RTIRequests()))
	}
	// answering after acknowledgement clears the overdue flag.
	r.AnswerRTI("RTI-A", "data published at /open-data")
	if _, ok := r.AcknowledgeRTI("RTI-A"); ok {
		t.Fatal("an answered RTI cannot be re-acknowledged")
	}
}

func TestGrievanceAndOpenData(t *testing.T) {
	r := New(func() time.Time { return time.Unix(0, 0).UTC() })
	r.FileGrievance("G-1", "mid-day meal quality", "parent-1", "block")
	if _, ok := r.ResolveGrievance("G-1"); !ok {
		t.Fatal("resolving a known grievance must succeed")
	}
	if _, ok := r.ResolveGrievance("ghost"); ok {
		t.Fatal("resolving an unknown grievance must fail")
	}
	for _, d := range OpenDatasets() {
		if !d.PIIFree {
			t.Fatalf("every open dataset must be PII-free: %+v", d)
		}
	}
	s := r.Summarise()
	if s.GrievResolved != 1 || s.OpenDatasets == 0 {
		t.Fatalf("summary wrong: %+v", s)
	}
}
