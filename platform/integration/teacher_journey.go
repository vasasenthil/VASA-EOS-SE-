package integration

import (
	"github.com/vasa-eos-se-tn/platform/consent"
)

// Posting is one of a staff member's school postings, derived from a ServiceRecord credential.
type Posting struct {
	CredentialID string `json:"credential_id"`
	UDISE        string `json:"udise"`
	Designation  string `json:"designation"`
	Cadre        string `json:"cadre"` // teaching | non-teaching
	Valid        bool   `json:"valid"` // the posting credential verifies + is not revoked
}

// TeacherProfile is the staff-360 record assembled across the layers — the service counterpart to the student
// journey: the employment lawful basis (§E), the postings (from the verifiable ServiceRecord credentials), the
// full verifiable wallet, and the audit timeline of actions about the staff member.
type TeacherProfile struct {
	EmployeeID     string          `json:"employee_id"`
	Found          bool            `json:"found"`
	LawfulBases    []consent.Grant `json:"lawful_bases"`
	Postings       []Posting       `json:"postings"`
	CurrentPosting *Posting        `json:"current_posting,omitempty"` // the active (valid) posting
	Wallet         Wallet          `json:"wallet"`
	Events         []JourneyEvent  `json:"events"`
	EventCount     int             `json:"event_count"`
	Verified       bool            `json:"audit_chain_verified"`
}

// TeacherProfile assembles a staff member's complete, auditable record by HRMS employee id. Read-only +
// derived: postings come from the verifiable ServiceRecord credentials, the timeline from the audit chain.
func (p *Platform) TeacherProfile(empID string) TeacherProfile {
	prof := TeacherProfile{EmployeeID: empID}
	prof.LawfulBases = p.AccessReport(empID).Grants
	prof.Wallet = p.Wallet(empID)

	// postings are the ServiceRecord credentials; a non-revoked, verifying one is the current posting.
	for _, c := range prof.Wallet.Credentials {
		if c.Type != "ServiceRecord" {
			continue
		}
		post := Posting{CredentialID: c.ID, UDISE: c.Claims["udise"], Designation: c.Claims["designation"], Cadre: c.Claims["cadre"], Valid: c.Valid}
		prof.Postings = append(prof.Postings, post)
		if post.Valid {
			cp := post
			prof.CurrentPosting = &cp
		}
	}

	for _, rec := range p.Audit.Records() {
		if mentions(rec.Resource, rec.Actor, empID) {
			prof.Events = append(prof.Events, JourneyEvent{Seq: rec.Seq, At: rec.TS, Action: rec.Action, Effect: rec.Effect, Detail: rec.Detail})
		}
	}
	prof.EventCount = len(prof.Events)
	_, err := p.Audit.Verify()
	prof.Verified = err == nil
	prof.Found = len(prof.Postings) > 0 || len(prof.LawfulBases) > 0 || prof.EventCount > 0
	return prof
}
