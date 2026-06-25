package integration

import (
	"os"
	"testing"

	"github.com/vasa-eos-se-tn/platform/exams"
)

// TestPgExamsDurable exercises the REAL PostgreSQL marks-sheet adapter: marks entry, lock+grade on submit, and
// moderation all persist across fresh store instances (the data is in Postgres, not process memory). Runs only
// when DATABASE_URL is set.
func TestPgExamsDurable(t *testing.T) {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		t.Skip("DATABASE_URL not set; durable PostgreSQL exams test runs against a live database only")
	}
	s1, err := newPgExamStore(dsn)
	if err != nil {
		t.Fatalf("connect/migrate: %v", err)
	}
	if _, err := s1.db.Exec(`DELETE FROM exam_sheets WHERE exam_id LIKE 'PGX-%'`); err != nil {
		t.Fatalf("cleanup: %v", err)
	}

	// create an open sheet + enter marks (durable).
	sh := exams.NewSheet("PGX-MATHS", "33000000001", "Mathematics", "Grade 10", 100)
	if err := s1.Add(sh); err != nil {
		t.Fatalf("add: %v", err)
	}
	for id, m := range map[string]int{"S1": 95, "S2": 30, "S3": 60} {
		if err := s1.Enter("PGX-MATHS", id, m); err != nil {
			t.Fatalf("enter %s: %v", id, err)
		}
	}

	// reopen from a fresh pool: marks must be there, still open.
	s2, _ := newPgExamStore(dsn)
	got, ok := s2.Get("PGX-MATHS")
	if !ok || got.Status != exams.Open || got.Count() != 3 {
		t.Fatalf("marks did not persist: ok=%v status=%v count=%d", ok, got.Status, got.Count())
	}

	// submit (lock + compute grades) on s2, then verify grades persisted to a third instance.
	if err := s2.Submit("PGX-MATHS"); err != nil {
		t.Fatalf("submit: %v", err)
	}
	s3, _ := newPgExamStore(dsn)
	g3, _ := s3.Get("PGX-MATHS")
	if g3.Status != exams.Submitted {
		t.Fatalf("submit not durable: %s", g3.Status)
	}
	if r, _ := g3.Get("S1"); r.Grade != "A1" || !r.Pass {
		t.Fatalf("computed grade not durable: %+v", r)
	}
	if r, _ := g3.Get("S2"); r.Pass {
		t.Fatal("30/100 must be a durable fail")
	}
	// entry is rejected once locked, even across instances.
	if err := s3.Enter("PGX-MATHS", "S9", 70); err == nil {
		t.Fatal("a submitted sheet must reject entry")
	}

	// moderate → published, durable to a fourth instance.
	if err := s3.Moderate("PGX-MATHS", true); err != nil {
		t.Fatalf("moderate: %v", err)
	}
	s4, _ := newPgExamStore(dsn)
	g4, _ := s4.Get("PGX-MATHS")
	if g4.Status != exams.Published {
		t.Fatalf("publication not durable: %s", g4.Status)
	}
	a := g4.Analytics()
	if a.Entered != 3 || a.Pass != 2 || a.Fail != 1 {
		t.Fatalf("durable analytics wrong: %+v", a)
	}
	// listing returns the sheet.
	if len(s4.Sheets()) == 0 {
		t.Fatal("durable Sheets() returned nothing")
	}
}
