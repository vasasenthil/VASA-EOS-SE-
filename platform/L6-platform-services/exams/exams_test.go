package exams

import "testing"

func TestGradeAndPassBands(t *testing.T) {
	cases := []struct {
		marks, max int
		grade      string
		pass       bool
	}{
		{95, 100, "A1", true},
		{85, 100, "A2", true},
		{40, 100, "D", true},
		{35, 100, "D", true},
		{34, 100, "E", false},
		{0, 100, "E", false},
		{45, 50, "A2", true}, // 90%
		{17, 50, "E", false}, // 34%
	}
	for _, c := range cases {
		if g := GradeFor(c.marks, c.max); g != c.grade {
			t.Fatalf("GradeFor(%d,%d)=%s want %s", c.marks, c.max, g, c.grade)
		}
		if p := Passed(c.marks, c.max); p != c.pass {
			t.Fatalf("Passed(%d,%d)=%v want %v", c.marks, c.max, p, c.pass)
		}
	}
}

func TestSheetEntryGuards(t *testing.T) {
	s := NewSheet("EX1", "S1", "Mathematics", "Grade 10", 100)
	if err := s.Enter("", 50); err == nil {
		t.Fatal("empty student must be rejected")
	}
	if err := s.Enter("stu1", 101); err == nil {
		t.Fatal("out-of-range marks must be rejected")
	}
	if err := s.Enter("stu1", -1); err == nil {
		t.Fatal("negative marks must be rejected")
	}
	if err := s.Enter("stu1", 72); err != nil {
		t.Fatalf("valid entry should succeed: %v", err)
	}
	// re-entry updates in place.
	if err := s.Enter("stu1", 80); err != nil || s.Count() != 1 {
		t.Fatalf("re-entry must update in place: count=%d err=%v", s.Count(), err)
	}
	if r, _ := s.Get("stu1"); r.Marks != 80 {
		t.Fatalf("update wrong: %+v", r)
	}
}

func TestSheetLifecycleSubmitModeratePublish(t *testing.T) {
	s := NewSheet("EX2", "S1", "Science", "Grade 10", 100)
	// cannot submit an empty sheet.
	if err := s.Submit(); err == nil {
		t.Fatal("empty sheet must not submit")
	}
	s.Enter("a", 95)
	s.Enter("b", 30)
	s.Enter("c", 55)
	if err := s.Submit(); err != nil {
		t.Fatalf("submit failed: %v", err)
	}
	if s.Status != Submitted {
		t.Fatalf("status should be submitted: %s", s.Status)
	}
	// grades computed on submit.
	if r, _ := s.Get("a"); r.Grade != "A1" || !r.Pass {
		t.Fatalf("grade not computed: %+v", r)
	}
	if r, _ := s.Get("b"); r.Pass {
		t.Fatal("30/100 must fail")
	}
	// cannot enter after lock.
	if err := s.Enter("d", 70); err == nil {
		t.Fatal("locked sheet must reject entry")
	}
	// moderate → published.
	if err := s.Moderate(true); err != nil || s.Status != Published {
		t.Fatalf("moderation publish failed: %s err=%v", s.Status, err)
	}
	// cannot moderate again.
	if err := s.Moderate(true); err == nil {
		t.Fatal("a published sheet cannot be moderated again")
	}
}

func TestSheetReturnAndResubmit(t *testing.T) {
	s := NewSheet("EX3", "S1", "Tamil", "Grade 9", 100)
	s.Enter("a", 88)
	s.Submit()
	if err := s.Moderate(false); err != nil || s.Status != Returned {
		t.Fatalf("return failed: %s err=%v", s.Status, err)
	}
	// a returned sheet can be corrected and resubmitted.
	if err := s.Enter("a", 90); err != nil {
		t.Fatalf("returned sheet must accept corrections: %v", err)
	}
	if err := s.Submit(); err != nil {
		t.Fatalf("resubmit failed: %v", err)
	}
}

func TestAnalytics(t *testing.T) {
	s := NewSheet("EX4", "S1", "Maths", "Grade 10", 100)
	marks := map[string]int{"a": 95, "b": 80, "c": 60, "d": 40, "e": 20}
	for id, m := range marks {
		s.Enter(id, m)
	}
	s.Submit()
	a := s.Analytics()
	if a.Entered != 5 || a.Pass != 4 || a.Fail != 1 {
		t.Fatalf("pass/fail wrong: %+v", a)
	}
	if a.Highest != 95 || a.Mean != 59 {
		t.Fatalf("mean/highest wrong: %+v", a)
	}
	if a.PassPct != 80 {
		t.Fatalf("pass pct wrong: %v", a.PassPct)
	}
	if a.GradeDist["A1"] != 1 || a.GradeDist["E"] != 1 {
		t.Fatalf("grade dist wrong: %+v", a.GradeDist)
	}
}

func TestRegisterAndSummarise(t *testing.T) {
	r := NewRegister()
	s1 := NewSheet("B-EX", "S1", "Maths", "Grade 10", 100)
	s1.Enter("a", 90)
	s1.Submit()
	s2 := NewSheet("A-EX", "S1", "Science", "Grade 10", 100)
	s2.Enter("a", 30)
	if err := r.Add(s1); err != nil {
		t.Fatal(err)
	}
	if err := r.Add(s2); err != nil {
		t.Fatal(err)
	}
	if err := r.Add(s1); err == nil {
		t.Fatal("duplicate exam id must be rejected")
	}
	sum := Summarise(r.Sheets())
	// sorted by exam id: A-EX before B-EX.
	if len(sum) != 2 || sum[0].ExamID != "A-EX" || sum[1].ExamID != "B-EX" {
		t.Fatalf("summary order wrong: %+v", sum)
	}
	if sum[1].Stats.Pass != 1 {
		t.Fatalf("submitted sheet stats wrong: %+v", sum[1].Stats)
	}
}
