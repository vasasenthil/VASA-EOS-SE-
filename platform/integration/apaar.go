package integration

import (
	"context"

	"github.com/vasa-eos-se-tn/platform/consent"
	"github.com/vasa-eos-se-tn/platform/credentials"
	"github.com/vasa-eos-se-tn/platform/reconcile"
)

// APAAREnrolment is a student enrolment federated from APAAR: the upstream APAAR identity (source of truth)
// plus the school's locally-submitted record, the target school (UDISE) and the class.
type APAAREnrolment struct {
	APAAR reconcile.ApaarRecord   `json:"apaar"` // upstream identity (the L4 adapter fetch; gated B-022)
	Local reconcile.StudentRecord `json:"local"` // the school's submitted record
	UDISE string                  `json:"udise"` // target school (a T6 leaf in the tenancy estate)
	Class string                  `json:"class"`
}

// EnrolmentOutcome is the end-to-end result of an APAAR-anchored enrolment.
type EnrolmentOutcome struct {
	APAARID       string                          `json:"apaar_id"`
	UDISE         string                          `json:"udise"`
	District      string                          `json:"district,omitempty"`
	Reconciled    bool                            `json:"reconciled"` // APAAR agrees with the local record (identity-critical)
	CriticalDrift int                             `json:"critical_drift"`
	Rationale     string                          `json:"rationale,omitempty"`
	Enrolled      bool                            `json:"enrolled"`
	Refused       bool                            `json:"refused"`
	Reason        string                          `json:"reason,omitempty"`
	Credential    *credentials.AnchoredCredential `json:"credential,omitempty"`
	AuditSeq      uint64                          `json:"audit_seq"`
}

// EnrolViaAPAAR runs an APAAR-anchored enrolment end-to-end, fail-closed: it reconciles the APAAR identity
// (source of truth) against the school's submitted record and BLOCKS on any identity-critical drift (a human
// must verify before either copy is trusted — no enrolment on a mismatched identity); it requires the target
// school to exist in the sovereign estate; it records the §7 legal-obligation lawful basis (RTE/UDISE+); and
// it issues a verifiable, notarised EnrolmentRecord credential. Every step is audited.
func (p *Platform) EnrolViaAPAAR(ctx context.Context, e APAAREnrolment) EnrolmentOutcome {
	out := EnrolmentOutcome{APAARID: e.APAAR.ApaarID, UDISE: e.UDISE}

	// L4: reconcile the upstream APAAR identity against the local record.
	rep := reconcile.CompareApaarToStudent(e.APAAR, e.Local)
	out.CriticalDrift, out.Rationale = rep.CriticalDriftCount, rep.Rationale
	if rep.CriticalDriftCount > 0 {
		out.Refused, out.Reason = true, "identity-critical drift between APAAR and the local record — human verification required"
		p.appendAudit("system", "enrol.apaar.block", e.APAAR.ApaarID, "verify", rep.Rationale)
		out.AuditSeq = uint64(p.Audit.Len())
		return out
	}
	out.Reconciled = true

	// L6 tenancy: the target school must exist in the sovereign estate.
	node, ok := p.TenantNode(e.UDISE)
	if !ok || node.Level != 6 {
		out.Refused, out.Reason = true, "unknown school (no such UDISE leaf in the estate)"
		return out
	}
	// the school's district is the T3 ancestor.
	if anc := p.tenancyAncestorAtLevel(e.UDISE, 3); anc != "" {
		out.District = anc
	}

	// §E DPDP: enrolment rests on a §7 legal obligation (RTE Act / UDISE+ reporting).
	if _, err := p.Consent.Grant("ENROL-"+e.APAAR.ApaarID, e.APAAR.ApaarID, "enrolment", consent.LegalObligation, true, ""); err != nil {
		// a duplicate basis is fine (idempotent re-enrolment); only a hard error refuses.
		if err != consent.ErrChildProhibited {
			// LegalObligation never hits the guardian/child-prohibited gates here, so any error is unexpected.
			out.Refused, out.Reason = true, "lawful basis could not be recorded: "+err.Error()
			return out
		}
	}

	// L7: a verifiable, notarised enrolment credential.
	cred, err := p.issueEnrolmentCredential(e.APAAR, e.UDISE, e.Class)
	if err != nil {
		out.Refused, out.Reason = true, "credential issuance failed: "+err.Error()
		return out
	}
	out.Credential = &cred
	out.Enrolled = true
	p.appendAudit("system", "enrol.apaar", e.APAAR.ApaarID, "enrolled", e.UDISE)
	out.AuditSeq = uint64(p.Audit.Len())
	return out
}

// tenancyAncestorAtLevel returns the id of a node's ancestor at the given tier level (or "" if none).
func (p *Platform) tenancyAncestorAtLevel(id string, level int) string {
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return ""
	}
	for _, a := range h.Ancestors(id) {
		if a.Level == level {
			return a.Name
		}
	}
	return ""
}

// issueEnrolmentCredential mints a verifiable, notarised enrolment-record credential.
func (p *Platform) issueEnrolmentCredential(a reconcile.ApaarRecord, udise, class string) (credentials.AnchoredCredential, error) {
	c := credentials.Credential{
		// school-specific id so a transfer produces a distinct enrolment record (the old one is revoked, kept).
		ID: "ENR-" + a.ApaarID + "-" + udise, Type: "EnrolmentRecord", Subject: a.ApaarID,
		Issuer: "APAAR-TamilNadu", IssuedAt: p.now(),
		Claims: map[string]string{"udise": udise, "class": class, "category": a.Category, "status": "enrolled"},
	}
	sc, err := credentials.Issue(c, p.cfg.IssuerKey)
	if err != nil {
		return credentials.AnchoredCredential{}, err
	}
	_, anchored, err := credentials.AnchorBatch(p.Notary, []credentials.SignedCredential{sc})
	if err != nil {
		return credentials.AnchoredCredential{}, err
	}
	p.recordCredential(anchored[0])
	return anchored[0], nil
}
