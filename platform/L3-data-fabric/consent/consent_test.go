package consent

import (
	"testing"
	"time"
)

// fixedClock returns an advanceable clock for deterministic retention math.
func fixedClock(start time.Time) (func() time.Time, func(d time.Duration)) {
	cur := start
	return func() time.Time { return cur }, func(d time.Duration) { cur = cur.Add(d) }
}

func seedRegister(t *testing.T) (*Register, func(time.Duration)) {
	t.Helper()
	now, adv := fixedClock(time.Date(2026, 6, 1, 0, 0, 0, 0, time.UTC))
	r := New(now)
	r.RegisterPurpose(Purpose{ID: "enrolment", Name: "RTE enrolment", PIIClass: 2, RetentionDays: 365})
	r.RegisterPurpose(Purpose{ID: "dbt", Name: "Scholarship DBT", PIIClass: 1, RetentionDays: 2555})
	r.RegisterPurpose(Purpose{ID: "behaviour-ads", Name: "Behavioural advertising", PIIClass: 2, RetentionDays: 30, ChildProhibited: true})
	return r, adv
}

func TestMinorConsentNeedsGuardianAndChildProhibition(t *testing.T) {
	r, _ := seedRegister(t)
	// a minor on a consent basis without a guardian → refused.
	if _, err := r.Grant("g1", "STU-1", "enrolment", Consent, true, ""); err != ErrGuardianReqd {
		t.Fatalf("expected ErrGuardianReqd, got %v", err)
	}
	// with verifiable parental consent → allowed.
	if _, err := r.Grant("g1", "STU-1", "enrolment", Consent, true, "PARENT-1"); err != nil {
		t.Fatalf("guardian-backed minor consent should succeed: %v", err)
	}
	// a child-prohibited purpose is refused for a minor regardless of guardian.
	if _, err := r.Grant("g2", "STU-1", "behaviour-ads", Consent, true, "PARENT-1"); err != ErrChildProhibited {
		t.Fatalf("expected ErrChildProhibited, got %v", err)
	}
}

func TestWithdrawOnlyConsentAndLawfulness(t *testing.T) {
	r, _ := seedRegister(t)
	r.Grant("g1", "STU-1", "enrolment", Consent, false, "")
	r.Grant("g2", "STU-1", "dbt", Subsidy, false, "")

	if ok, _ := r.LawfulToProcess("g1"); !ok {
		t.Fatal("an active consent grant must be lawful to process")
	}
	// consent is withdrawable; a §7 legitimate use is not.
	if _, err := r.Withdraw("g1", "STU-1"); err != nil {
		t.Fatalf("consent withdrawal should succeed: %v", err)
	}
	if ok, reason := r.LawfulToProcess("g1"); ok || reason == "" {
		t.Fatalf("withdrawn consent must not be lawful, got ok=%v reason=%q", ok, reason)
	}
	if _, err := r.Withdraw("g2", "STU-1"); err != ErrNotConsent {
		t.Fatalf("a legitimate-use basis must not be withdrawable, got %v", err)
	}
}

func TestRetentionSweepAndStatutoryHold(t *testing.T) {
	r, adv := seedRegister(t)
	r.Grant("g1", "STU-1", "enrolment", Consent, false, "") // 365-day retention
	r.Grant("g2", "STU-2", "enrolment", Consent, false, "")
	r.EndPurpose("g1", "system")
	r.EndPurpose("g2", "system")
	// g2 is under a statutory hold (e.g. open POCSO case).
	r.SetStatutoryHold("g2", true, "Legal", "open inquiry")

	// before the window elapses, nothing is due.
	if r.ErasureDue("g1") {
		t.Fatal("erasure must not be due before the retention window elapses")
	}
	adv(366 * 24 * time.Hour) // past the 365-day window
	if !r.ErasureDue("g1") {
		t.Fatal("erasure should be due after the retention window")
	}
	erased, held := r.RunRetention("retention-sweep")
	if len(erased) != 1 || erased[0] != "g1" {
		t.Fatalf("g1 should be erased by the sweep, got %v", erased)
	}
	if len(held) != 1 || held[0] != "g2" {
		t.Fatalf("g2 should be held back by the statutory hold, got %v", held)
	}
	if ok, _ := r.LawfulToProcess("g1"); ok {
		t.Fatal("erased data must not be lawful to process")
	}
}

func TestForcedErasureRespectsHold(t *testing.T) {
	r, _ := seedRegister(t)
	r.Grant("g1", "STU-1", "enrolment", Consent, false, "")
	r.SetStatutoryHold("g1", true, "Legal", "court order")
	// a data-principal erasure request (force) is still blocked by a statutory hold.
	if _, err := r.Erase("g1", "STU-1", true); err != ErrStatutoryHold {
		t.Fatalf("statutory hold must block even a forced erasure, got %v", err)
	}
	r.SetStatutoryHold("g1", false, "Legal", "case closed")
	if _, err := r.Erase("g1", "STU-1", true); err != nil {
		t.Fatalf("forced erasure should succeed once the hold is lifted: %v", err)
	}
}

func TestAccessReportAndSummary(t *testing.T) {
	r, _ := seedRegister(t)
	r.Grant("g1", "STU-1", "enrolment", Consent, true, "PARENT-1")
	r.Grant("g2", "STU-1", "dbt", Subsidy, true, "PARENT-1")
	r.Grant("g3", "STU-2", "enrolment", Consent, false, "")

	rep := r.Access("STU-1")
	if len(rep.Grants) != 2 {
		t.Fatalf("STU-1 access report should list 2 grants, got %d", len(rep.Grants))
	}
	s := r.Summary()
	if s.Purposes != 3 || s.Grants != 3 {
		t.Fatalf("summary purpose/grant counts wrong: %+v", s)
	}
	if s.Minors != 2 || s.GuardianGiven != 2 {
		t.Fatalf("summary minor/guardian counts wrong: %+v", s)
	}
	if s.ByBasis[Consent] != 2 || s.ByBasis[Subsidy] != 1 {
		t.Fatalf("summary basis counts wrong: %+v", s)
	}
}

func TestUnknownPurposeAndGrant(t *testing.T) {
	r, _ := seedRegister(t)
	if _, err := r.Grant("g1", "STU-1", "nope", Consent, false, ""); err != ErrUnknownPurpose {
		t.Fatalf("expected ErrUnknownPurpose, got %v", err)
	}
	if _, err := r.Withdraw("nope", "x"); err != ErrUnknownGrant {
		t.Fatalf("expected ErrUnknownGrant, got %v", err)
	}
}
