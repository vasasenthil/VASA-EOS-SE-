package integration

import (
	"strings"

	"github.com/vasa-eos-se-tn/platform/civic"
	"github.com/vasa-eos-se-tn/platform/consent"
)

// JourneyEvent is one entry on a learner's auditable timeline (derived from the immutable L5 audit chain).
type JourneyEvent struct {
	Seq    uint64 `json:"seq"`
	At     string `json:"at"`
	Action string `json:"action"`
	Effect string `json:"effect"`
	Detail string `json:"detail,omitempty"`
}

// StudentJourney is the single, auditable "student 360" record assembled across the verticals — the brief's
// "one identity, one record": the learner's DPDP lawful bases (§E), the grievances they raised (L12), and the
// full timeline of platform actions about them, reconstructed from the tamper-evident audit chain (L5).
type StudentJourney struct {
	APAARID     string            `json:"apaar_id"`
	LawfulBases []consent.Grant   `json:"lawful_bases"`
	Grievances  []civic.Grievance `json:"grievances"`
	Events      []JourneyEvent    `json:"events"`
	EventCount  int               `json:"event_count"`
	Verified    bool              `json:"audit_chain_verified"` // the underlying audit chain is intact
}

// mentions reports whether an audit record concerns a principal (its resource or actor references the id, incl.
// composite ids like "DBT-<scheme>-<apaar>" or "ENROL-<apaar>").
func mentions(resource, actor, id string) bool {
	return resource == id || actor == id || strings.Contains(resource, id) || strings.Contains(actor, id)
}

// StudentJourney assembles a learner's complete, auditable record by APAAR id. It is read-only and derived: the
// timeline comes straight from the audit chain (whose integrity is re-verified), so the record cannot show an
// action the chain does not contain.
func (p *Platform) StudentJourney(apaarID string) StudentJourney {
	j := StudentJourney{APAARID: apaarID}
	j.LawfulBases = p.AccessReport(apaarID).Grants
	j.Grievances = p.Civic.GrievancesBy(apaarID)

	for _, rec := range p.Audit.Records() {
		if mentions(rec.Resource, rec.Actor, apaarID) {
			j.Events = append(j.Events, JourneyEvent{Seq: rec.Seq, At: rec.TS, Action: rec.Action, Effect: rec.Effect, Detail: rec.Detail})
		}
	}
	j.EventCount = len(j.Events)
	_, err := p.Audit.Verify()
	j.Verified = err == nil
	return j
}
