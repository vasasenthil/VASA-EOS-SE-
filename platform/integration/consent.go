package integration

import "github.com/vasa-eos-se-tn/platform/consent"

// bootstrapConsent seeds the §E register with the platform's standing processing purposes and their DPDP
// retention rules. Most pupil-facing processing rests on a §7 legitimate use (legal obligation under the RTE
// Act / UDISE+ reporting); AI tutoring rests on (guardian) consent and is the one a principal may withdraw.
func bootstrapConsent() *consent.Register {
	r := consent.New(nil)
	r.RegisterPurpose(consent.Purpose{ID: "enrolment", Name: "School enrolment & APAAR (RTE/UDISE+)", PIIClass: 2, RetentionDays: 2555}) // 7y after exit
	r.RegisterPurpose(consent.Purpose{ID: "attendance", Name: "Daily attendance", PIIClass: 3, RetentionDays: 1825})                     // 5y
	r.RegisterPurpose(consent.Purpose{ID: "assessment", Name: "Assessment & marks", PIIClass: 3, RetentionDays: 3650})                   // 10y
	r.RegisterPurpose(consent.Purpose{ID: "scheme-dbt", Name: "Scholarship / DBT delivery (PFMS)", PIIClass: 1, RetentionDays: 2555})    // 7y (financial)
	r.RegisterPurpose(consent.Purpose{ID: "ai-tutoring", Name: "AI tutoring & personalisation", PIIClass: 3, RetentionDays: 365})        // 1y, consent-based
	r.RegisterPurpose(consent.Purpose{ID: "behaviour-ads", Name: "Behavioural advertising / profiling", PIIClass: 2, RetentionDays: 0, ChildProhibited: true})
	return r
}

// ConsentSummary returns the §E register roll-up (purposes, grants by status/basis, minors, holds, due erasures).
func (p *Platform) ConsentSummary() consent.Summary { return p.Consent.Summary() }

// ConsentPurposes returns the registered processing-purpose catalogue.
func (p *Platform) ConsentPurposes() []consent.Purpose { return p.Consent.Purposes() }

// RecordConsent records a lawful basis for a principal + purpose (enforcing the DPDP §9 child protections).
func (p *Platform) RecordConsent(id, principal, purposeID string, basis consent.Basis, minor bool, guardian string) (consent.Grant, error) {
	return p.Consent.Grant(id, principal, purposeID, basis, minor, guardian)
}

// WithdrawConsent records a data principal withdrawing consent (DPDP §6(4)).
func (p *Platform) WithdrawConsent(id, by string) (consent.Grant, error) {
	return p.Consent.Withdraw(id, by)
}

// LawfulToProcess reports whether a grant currently authorises processing.
func (p *Platform) LawfulToProcess(id string) (bool, string) { return p.Consent.LawfulToProcess(id) }

// AccessReport answers a DPDP §11 right-to-access request for a data principal.
func (p *Platform) AccessReport(principal string) consent.AccessReport {
	return p.Consent.Access(principal)
}

// RunRetention sweeps the register and erases grants whose retention window has elapsed (DPDP §8(7)).
func (p *Platform) RunRetention(by string) (erased, heldBack []string) {
	return p.Consent.RunRetention(by)
}
