package loadmodel

import (
	"testing"
	"time"
)

func TestSuiteValidates(t *testing.T) {
	for _, s := range Suite() {
		if err := s.Validate(); err != nil {
			t.Errorf("scenario %q should validate: %v", s.Name, err)
		}
	}
}

func TestCroreHourShape(t *testing.T) {
	s := CroreHour()
	if s.PeakVUs() != 1*Crore {
		t.Fatalf("crore-hour peak should be 1 crore, got %d", s.PeakVUs())
	}
	if s.TotalDuration() != 80*time.Minute {
		t.Fatalf("crore-hour total should be 80m, got %v", s.TotalDuration())
	}
	// halfway up the 10m ramp → ~half of 1 crore
	mid := s.ActiveVUsAt(5 * time.Minute)
	if mid < 4_900_000 || mid > 5_100_000 {
		t.Fatalf("at 5m the ramp should be ~5,000,000 active, got %d", mid)
	}
	// during steady state → full crore
	if got := s.ActiveVUsAt(40 * time.Minute); got != 1*Crore {
		t.Fatalf("steady state should hold 1 crore, got %d", got)
	}
	// before the run → 0
	if s.ActiveVUsAt(0) != 0 {
		t.Fatal("before the run there are no active VUs")
	}
}

func TestSurgePeak(t *testing.T) {
	if Surge().PeakVUs() != 2*Crore {
		t.Fatalf("surge peak should be 2 crore, got %d", Surge().PeakVUs())
	}
}

func TestSoakDuration(t *testing.T) {
	s := Soak()
	if s.TotalDuration() < 72*time.Hour {
		t.Fatalf("soak must run at least 72h, got %v", s.TotalDuration())
	}
	// steady soak load is 30 lakh
	if got := s.ActiveVUsAt(time.Hour); got != 3*Crore/10 {
		t.Fatalf("soak steady load should be 30 lakh, got %d", got)
	}
}

func TestRampDownReachesZero(t *testing.T) {
	s := CroreHour()
	if got := s.ActiveVUsAt(s.TotalDuration()); got != 0 {
		t.Fatalf("at the end the ramp-down should reach 0, got %d", got)
	}
}

func TestValidateRejectsBad(t *testing.T) {
	if err := (Scenario{Name: "x"}).Validate(); err == nil {
		t.Fatal("a scenario with no stages must be rejected")
	}
	if err := (Scenario{Name: "x", Stages: []Stage{{Duration: 0, TargetVUs: 1}}}).Validate(); err == nil {
		t.Fatal("a zero-duration stage must be rejected")
	}
	if err := (Scenario{Name: "x", Stages: []Stage{{Duration: time.Minute, TargetVUs: -1}}}).Validate(); err == nil {
		t.Fatal("a negative target must be rejected")
	}
}
