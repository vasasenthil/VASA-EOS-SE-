package integration

import (
	"testing"

	"github.com/vasa-eos-se-tn/platform/consent"
)

func TestPlatformConsentSeededAtBoot(t *testing.T) {
	p := newPlatform(t)
	purposes := p.ConsentPurposes()
	if len(purposes) < 5 {
		t.Fatalf("expected the standing processing purposes seeded, got %d", len(purposes))
	}
	if p.ConsentSummary().Purposes < 5 {
		t.Fatalf("summary should report the seeded purposes: %+v", p.ConsentSummary())
	}
}

func TestPlatformConsentRightsFlow(t *testing.T) {
	p := newPlatform(t)
	// a minor needs verifiable parental consent for AI tutoring.
	if _, err := p.RecordConsent("G1", "STU-9", "ai-tutoring", consent.Consent, true, ""); err != consent.ErrGuardianReqd {
		t.Fatalf("minor consent without a guardian must be refused, got %v", err)
	}
	g, err := p.RecordConsent("G1", "STU-9", "ai-tutoring", consent.Consent, true, "PARENT-9")
	if err != nil {
		t.Fatal(err)
	}
	if ok, _ := p.LawfulToProcess(g.ID); !ok {
		t.Fatal("an active consent grant must be lawful to process")
	}
	// the principal exercises withdrawal (DPDP §6(4)).
	if _, err := p.WithdrawConsent(g.ID, "STU-9"); err != nil {
		t.Fatal(err)
	}
	if ok, reason := p.LawfulToProcess(g.ID); ok || reason == "" {
		t.Fatalf("withdrawn consent must not be lawful, got ok=%v reason=%q", ok, reason)
	}
	// right-to-access surfaces the grant.
	rep := p.AccessReport("STU-9")
	if len(rep.Grants) != 1 {
		t.Fatalf("access report should list the principal's grant, got %d", len(rep.Grants))
	}
}

func TestPlatformConsentChildProhibition(t *testing.T) {
	p := newPlatform(t)
	if _, err := p.RecordConsent("G2", "STU-9", "behaviour-ads", consent.Consent, true, "PARENT-9"); err != consent.ErrChildProhibited {
		t.Fatalf("behavioural advertising must be refused for a minor, got %v", err)
	}
}
