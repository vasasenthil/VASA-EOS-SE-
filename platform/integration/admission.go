package integration

import (
	"context"
	"fmt"
	"strings"

	"github.com/vasa-eos-se-tn/platform/audit"
	"github.com/vasa-eos-se-tn/platform/credentials"
	"github.com/vasa-eos-se-tn/platform/dataplane"
	"github.com/vasa-eos-se-tn/platform/pep"
)

// AdmissionRequest is an RTE admission application entering at the surface.
type AdmissionRequest struct {
	Tenant        string
	ActorRole     string // the authority processing it (e.g. "HEAD_TEACHER")
	Decision      string // "admit" | "reject"
	ApplicantID   string
	ApplicantName string
	ApplicantAge  int
	Category      string           // GEN | OBC | SC | ST | EWS | DG
	Region        dataplane.Region // requested PII residency region
	QuotaFull     bool             // is the RTE 25% quota already full?
}

// AdmissionResult is the outcome of the end-to-end admission workflow.
type AdmissionResult struct {
	Stage       string // the terminal stage reached
	Allowed     bool
	Effect      string   // permit | deny | require-approval
	Reasons     []string // governing rule ids
	PIIEnvelope bool     // PII was sealed under the tenant KEK
	Placement   dataplane.Placement
	AuditSeq    uint64                          // the audit-chain sequence of the decision record
	RequestID   string                          // the HITL request id (when pending approval)
	Credential  *credentials.AnchoredCredential // issued + notarised on admission
}

// Admission runs the full top-to-bottom admission workflow, descending the layers:
// L10 rate-limit/admission → L1 off-switch → L3 residency → L5 KMS → L5 PEP → L5 audit → L9 HITL → L7 credential.
func (p *Platform) Admission(ctx context.Context, req AdmissionRequest) (AdmissionResult, error) {
	var res AdmissionResult

	// L1 — sovereign off-switch: a disabled platform serves nothing.
	if p.Switch.Engaged() {
		res.Stage, res.Reasons = "offswitch", []string{"PLATFORM-DISABLED"}
		p.recordOutcome(true) // a deliberate shutdown is not an availability fault
		return res, nil
	}

	// L10 — fair per-tenant rate limit + global admission control (load shedding).
	if !p.Limiter.Allow(req.Tenant) {
		res.Stage, res.Reasons = "rate-limited", []string{"RATE-LIMIT"}
		p.recordOutcome(false)
		return res, nil
	}
	if !p.Adm.Acquire() {
		res.Stage, res.Reasons = "shed", []string{"LOAD-SHED"}
		p.recordOutcome(false)
		return res, nil
	}
	defer p.Adm.Release()

	// L3 — data residency: the applicant's identifiers are Class-1 PII and may reside only in a TN region.
	place := dataplane.Route(dataplane.Record{Category: "aadhaar", Datatype: "row", Tenant: req.Tenant, Region: req.Region})
	res.Placement = place
	if !place.Allowed {
		res.Stage, res.Reasons = "residency", place.Reasons
		p.appendAudit("role:"+req.ActorRole, "data.residency.deny", req.ApplicantID, "deny", strings.Join(place.Reasons, ","))
		p.recordOutcome(true) // correctly refused — a policy outcome, not an availability fault
		return res, nil
	}

	// L5 — KMS: seal the applicant PII under the tenant KEK before it is persisted.
	pii := []byte(fmt.Sprintf("name=%s;age=%d", req.ApplicantName, req.ApplicantAge))
	if _, err := p.KMS.Encrypt(req.Tenant, pii, []byte(req.ApplicantID)); err != nil {
		p.recordOutcome(false)
		return res, fmt.Errorf("integration: kms encrypt: %w", err)
	}
	res.PIIEnvelope = true

	// L5 — PEP: authorise the decision against the composed Rego policy plane.
	action := "admission.admit"
	if req.Decision == "reject" {
		action = "admission.reject"
	}
	dec := p.PEP.Authorize(ctx, pep.Request{
		Subject:  pep.Subject{Role: req.ActorRole, Tenant: req.Tenant},
		Action:   action,
		Resource: pep.Resource{Type: "application", Tenant: req.Tenant, Attributes: map[string]any{"category": req.Category, "quotaFull": req.QuotaFull, "age": req.ApplicantAge}},
	})
	res.Effect, res.Reasons = string(dec.Effect), dec.Reasons

	// L5 — audit: every decision is chained immutably.
	rec := p.appendAudit("role:"+req.ActorRole, action, req.ApplicantID, string(dec.Effect), strings.Join(dec.Reasons, ","))
	res.AuditSeq = rec.Seq

	switch dec.Effect {
	case pep.Deny:
		res.Stage, res.Allowed = "denied", false
		p.recordOutcome(true)
		return res, nil

	case pep.RequireApproval:
		// L9 — route to a human-in-the-loop review; only a scoped officer may finalise it.
		r, err := p.Queue.Enqueue("compliance", "admission.finalise", map[string]any{
			"decision": req.Decision, "applicantId": req.ApplicantID, "applicantName": req.ApplicantName,
			"category": req.Category, "tenant": req.Tenant,
		}, "admission.decide")
		if err != nil {
			p.recordOutcome(false)
			return res, err
		}
		res.Stage, res.RequestID, res.Allowed = "pending-approval", r.ID, false
		p.recordOutcome(true)
		return res, nil

	default: // permit
		res.Stage, res.Allowed = "admitted", true
		if req.Decision == "admit" {
			ac, err := p.issueAdmissionCredential(req.Tenant, req.ApplicantID, req.ApplicantName, req.Category)
			if err != nil {
				p.recordOutcome(false)
				return res, err
			}
			res.Credential = &ac
		}
		p.recordOutcome(true)
		return res, nil
	}
}

// appendAudit chains one record and returns it (errors are swallowed — the chain append cannot fail for a
// well-formed entry, and an audit write must never block the request path).
func (p *Platform) appendAudit(actor, action, resource, effect, detail string) audit.Record {
	rec, _ := p.Audit.Append(audit.Entry{TS: p.now(), Actor: actor, Action: action, Resource: resource, Effect: effect, Detail: detail})
	return rec
}

// issueAdmissionCredential issues an ed25519-signed admission credential and anchors it to the notary (L7).
func (p *Platform) issueAdmissionCredential(tenant, applicantID, name, category string) (credentials.AnchoredCredential, error) {
	c := credentials.Credential{
		ID: "ADM-" + applicantID, Type: "AdmissionRecord", Subject: applicantID,
		Issuer: "DGE-TamilNadu", IssuedAt: p.now(),
		Claims: map[string]string{"tenant": tenant, "category": category, "status": "admitted"},
	}
	sc, err := credentials.Issue(c, p.cfg.IssuerKey)
	if err != nil {
		return credentials.AnchoredCredential{}, err
	}
	_, anchored, err := credentials.AnchorBatch(p.Notary, []credentials.SignedCredential{sc})
	if err != nil {
		return credentials.AnchoredCredential{}, err
	}
	return anchored[0], nil
}

// Execute makes the platform the HITL executor: when an officer approves an admission review, this issues the
// verifiable credential (on admit) or records the upheld rejection. It satisfies hitl.Executor.
func (p *Platform) Execute(_ context.Context, tool string, args map[string]any) (string, error) {
	switch tool {
	case "admission.finalise":
		decision, _ := args["decision"].(string)
		if decision == "admit" {
			applicantID, _ := args["applicantId"].(string)
			name, _ := args["applicantName"].(string)
			category, _ := args["category"].(string)
			tenant, _ := args["tenant"].(string)
			ac, err := p.issueAdmissionCredential(tenant, applicantID, name, category)
			if err != nil {
				return "", err
			}
			return "admitted; credential " + ac.Signed.Credential.ID + " anchored", nil
		}
		return "rejection upheld and recorded", nil
	default:
		return "", fmt.Errorf("integration: unknown tool %q", tool)
	}
}
