package integration

import (
	"context"

	"github.com/vasa-eos-se-tn/platform/adapters"
	"github.com/vasa-eos-se-tn/platform/consent"
	"github.com/vasa-eos-se-tn/platform/credentials"
	"github.com/vasa-eos-se-tn/platform/reconcile"
)

// TeacherOnboarding is a staff onboarding federated from HRMS-TN: the upstream HRMS record (source of truth)
// plus the school's locally-submitted record, and the posting school (UDISE).
type TeacherOnboarding struct {
	HRMS  adapters.TeacherRecord `json:"hrms"`  // upstream identity (the L4 adapter fetch; gated B-022)
	Local adapters.TeacherRecord `json:"local"` // the school's submitted record
	UDISE string                 `json:"udise"` // posting school (a T6 leaf in the estate)
}

// TeacherOutcome is the end-to-end result of an HRMS-anchored staff onboarding.
type TeacherOutcome struct {
	EmployeeID    string                          `json:"employee_id"`
	UDISE         string                          `json:"udise"`
	District      string                          `json:"district,omitempty"`
	Reconciled    bool                            `json:"reconciled"`
	CriticalDrift int                             `json:"critical_drift"`
	Rationale     string                          `json:"rationale,omitempty"`
	Onboarded     bool                            `json:"onboarded"`
	Refused       bool                            `json:"refused"`
	Reason        string                          `json:"reason,omitempty"`
	Credential    *credentials.AnchoredCredential `json:"service_credential,omitempty"`
	AuditSeq      uint64                          `json:"audit_seq"`
}

// OnboardTeacher runs an HRMS-anchored staff onboarding end-to-end, fail-closed: it reconciles the HRMS
// identity (source of truth) against the school's submitted record and BLOCKS on identity-critical drift
// (employee id / name); it requires the posting school to exist in the estate; it records the §7 employment
// lawful basis (HRMS service record); and it issues a verifiable, notarised ServiceRecord credential. Audited.
func (p *Platform) OnboardTeacher(ctx context.Context, t TeacherOnboarding) TeacherOutcome {
	out := TeacherOutcome{EmployeeID: t.HRMS.EmployeeID, UDISE: t.UDISE}

	// L4: reconcile the upstream HRMS identity against the local record (employee id + name are identity-critical).
	rep := reconcile.Compare([]reconcile.Field{
		{Field: "emp_id", Label: "Employee id", Upstream: t.HRMS.EmployeeID, Local: t.Local.EmployeeID, Critical: true},
		{Field: "name", Label: "Name", Upstream: t.HRMS.Name, Local: t.Local.Name, Critical: true},
		{Field: "designation", Label: "Designation", Upstream: t.HRMS.Designation, Local: t.Local.Designation},
	})
	out.CriticalDrift, out.Rationale = rep.CriticalDriftCount, rep.Rationale
	if rep.CriticalDriftCount > 0 {
		out.Refused, out.Reason = true, "identity-critical drift between HRMS and the local record — human verification required"
		p.appendAudit("system", "staff.onboard.block", t.HRMS.EmployeeID, "verify", rep.Rationale)
		out.AuditSeq = uint64(p.Audit.Len())
		return out
	}
	out.Reconciled = true

	// L6 tenancy: the posting school must exist in the sovereign estate.
	if node, ok := p.TenantNode(t.UDISE); !ok || node.Level != 6 {
		out.Refused, out.Reason = true, "unknown posting school (no such UDISE leaf in the estate)"
		return out
	}
	out.District = p.tenancyAncestorAtLevel(t.UDISE, 3)

	// §E DPDP: staff processing rests on a §7 employment legitimate use.
	if _, err := p.Consent.Grant("STAFF-"+t.HRMS.EmployeeID, t.HRMS.EmployeeID, "staff-hrms", consent.Employment, false, ""); err != nil {
		out.Refused, out.Reason = true, "lawful basis could not be recorded: "+err.Error()
		return out
	}

	// L7: a verifiable, notarised service-record credential.
	cred, err := p.issueServiceCredential(t.HRMS, t.UDISE)
	if err != nil {
		out.Refused, out.Reason = true, "service credential failed: "+err.Error()
		return out
	}
	out.Credential = &cred
	out.Onboarded = true
	p.appendAudit("system", "staff.onboard", t.HRMS.EmployeeID, "onboarded", t.UDISE)
	out.AuditSeq = uint64(p.Audit.Len())
	return out
}

// issueServiceCredential mints a verifiable, notarised staff service-record credential.
func (p *Platform) issueServiceCredential(t adapters.TeacherRecord, udise string) (credentials.AnchoredCredential, error) {
	cadre := "non-teaching"
	if t.Teaching {
		cadre = "teaching"
	}
	c := credentials.Credential{
		ID: "SVC-" + t.EmployeeID + "-" + udise, Type: "ServiceRecord", Subject: t.EmployeeID,
		Issuer: "HRMS-TamilNadu", IssuedAt: p.now(),
		Claims: map[string]string{"udise": udise, "designation": t.Designation, "cadre": cadre, "status": "posted"},
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
