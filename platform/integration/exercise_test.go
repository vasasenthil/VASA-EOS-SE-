package integration

import (
	"context"
	"testing"
)

func TestExerciseDrivesCohortThroughLiveGate(t *testing.T) {
	p := newPlatform(t)
	const n = 100
	auditBefore := p.Audit.Len()
	res := p.ExerciseOnboarding(context.Background(), n)

	if res.Cohort != n || res.GrantsRecorded != n {
		t.Fatalf("every cohort member should get a lawful-basis grant: %+v", res)
	}
	// 1-in-20 is routed offshore and must be quarantined at residency; the rest must onboard cleanly.
	if res.Onboarded == 0 || res.Quarantined == 0 {
		t.Fatalf("the exercise must show both clean onboarding and fail-closed quarantine: %+v", res)
	}
	if res.Onboarded+res.Quarantined != n {
		t.Fatalf("every record is either onboarded or quarantined (never lost): %+v", res)
	}
	if res.ByFailedStep["residency-enforce"] == 0 {
		t.Fatalf("offshore Class-2 PII must quarantine at residency: %+v", res.ByFailedStep)
	}
	// the run is anchored to real districts and extends the immutable audit chain.
	if res.Districts < 1 {
		t.Fatalf("the cohort must touch real districts: %+v", res)
	}
	if res.AuditRecords <= auditBefore {
		t.Fatalf("the live run must extend the audit chain: before=%d after=%d", auditBefore, res.AuditRecords)
	}
}

func TestExerciseConsentMakesOnboardingLawful(t *testing.T) {
	p := newPlatform(t)
	// after the exercise records grants, the per-principal lawful basis is queryable in the §E register.
	res := p.ExerciseOnboarding(context.Background(), 40)
	coh := p.SyntheticCohort(1, 0)
	if ok, _ := p.Consent.HasLawfulBasis(coh.Students[0].APAAR, "ai-tutoring"); !ok {
		t.Fatal("the first cohort principal should hold a live lawful basis after the exercise")
	}
	if res.GrantsRecorded != 40 {
		t.Fatalf("expected 40 grants recorded, got %d", res.GrantsRecorded)
	}
}
