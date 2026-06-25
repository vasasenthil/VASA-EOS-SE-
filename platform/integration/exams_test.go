package integration

import "testing"

func TestExamSeedAndDashboardScoped(t *testing.T) {
	p := newPlatform(t)
	// the sovereign sees all seeded sheets; the dashboard rolls up status + an aggregate pass picture.
	d := p.ExamResultsDashboard("TN")
	if d.Sheets < 3 {
		t.Fatalf("expected the seeded sheets, got %d", d.Sheets)
	}
	if d.ByStatus["open"] == 0 || d.ByStatus["submitted"] == 0 || d.ByStatus["published"] == 0 {
		t.Fatalf("expected sheets across the lifecycle: %+v", d.ByStatus)
	}
	if d.ResultsRecorded == 0 || d.OverallPct < 0 || d.OverallPct > 100 {
		t.Fatalf("aggregate results wrong: %+v", d)
	}
	if len(d.PerSheet) != d.Sheets {
		t.Fatalf("per-sheet count mismatch: %d vs %d", len(d.PerSheet), d.Sheets)
	}
	// an unknown scope sees nothing (fail-closed).
	if got := p.ExamResultsDashboard("TN-DIST-Nowhere"); got.Sheets != 0 {
		t.Fatalf("unknown scope must see no sheets: %d", got.Sheets)
	}
}

func TestEnterMarksGatedByIAM(t *testing.T) {
	p := newPlatform(t)
	const exam = "EXM-CHN-MATHS-T1"
	// the seeded teacher (teaching cadre, in-jurisdiction) may enter marks.
	if err := p.EnterMarks(exam, "SYN-STU-001", 88, "SYN-U-TCH"); err != nil {
		t.Fatalf("the teacher must be allowed to enter marks: %v", err)
	}
	if d, _ := p.ExamSheet(exam); func() bool {
		for _, r := range d.Results {
			if r.StudentID == "SYN-STU-001" && r.Marks == 88 {
				return false
			}
		}
		return true
	}() {
		t.Fatal("the entered mark was not recorded")
	}
	// a citizen (no write:assessment grant) is denied by the PDP.
	if err := p.EnterMarks(exam, "SYN-STU-002", 50, "SYN-U-CIT"); err == nil {
		t.Fatal("a citizen must not be able to enter marks")
	}
	// the DEO (correct district, but not teaching cadre) is denied by ABAC — marks entry is cadre-restricted.
	if err := p.EnterMarks(exam, "SYN-STU-003", 50, "SYN-U-DEO"); err == nil {
		t.Fatal("a non-teaching role must be denied marks entry by the cadre gate")
	}
	// an unknown actor is denied.
	if err := p.EnterMarks(exam, "SYN-STU-004", 50, "NOBODY"); err == nil {
		t.Fatal("an unknown actor must be denied")
	}
}

func TestModerationSeparationOfDuties(t *testing.T) {
	p := newPlatform(t)
	const exam = "EXM-CHN-SCI-T1" // seeded already submitted, awaiting moderation
	// the teacher who can ENTER marks cannot MODERATE them (needs write:school) — separation of duties.
	if err := p.ModerateMarksSheet(exam, true, "SYN-U-TCH"); err == nil {
		t.Fatal("a plain teacher must not be able to moderate results")
	}
	// the head teacher (write:school, in-jurisdiction) can moderate → publish.
	if err := p.ModerateMarksSheet(exam, true, "SYN-U-HM"); err != nil {
		t.Fatalf("the head teacher must be able to moderate: %v", err)
	}
	if d, _ := p.ExamSheet(exam); d.Status != "published" {
		t.Fatalf("after moderation the sheet must be published: %s", d.Status)
	}
	// a published sheet cannot be moderated again.
	if err := p.ModerateMarksSheet(exam, true, "SYN-U-HM"); err == nil {
		t.Fatal("a published sheet cannot be moderated again")
	}
}

func TestSubmitFlowAndGrades(t *testing.T) {
	p := newPlatform(t)
	const exam = "EXM-CHN-MATHS-T1" // seeded open
	// the head teacher submits the open sheet (write:assessment granted to HEAD_TEACHER) → grades computed.
	if err := p.SubmitMarksSheet(exam, "SYN-U-HM"); err != nil {
		t.Fatalf("submit failed: %v", err)
	}
	d, ok := p.ExamSheet(exam)
	if !ok || d.Status != "submitted" {
		t.Fatalf("sheet must be submitted: %+v", d)
	}
	// grades are now populated and the analytics pass picture is internally consistent.
	graded := 0
	for _, r := range d.Results {
		if r.Grade != "" {
			graded++
		}
	}
	if graded != len(d.Results) {
		t.Fatalf("all results must be graded after submit: %d of %d", graded, len(d.Results))
	}
	if d.Stats.Pass+d.Stats.Fail != d.Stats.Entered {
		t.Fatalf("pass+fail must equal entered: %+v", d.Stats)
	}
	// marks can no longer be entered once submitted.
	if err := p.EnterMarks(exam, "SYN-STU-099", 70, "SYN-U-TCH"); err == nil {
		t.Fatal("a submitted sheet must reject marks entry")
	}
}
