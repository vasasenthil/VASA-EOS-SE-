package integration

import (
	"context"
	"errors"

	"github.com/vasa-eos-se-tn/platform/hitl"
)

// FinaliseAdmission resolves a pending-approval admission application end-to-end: a scoped officer decides the
// queued HITL request, and the DURABLE application record is updated to its final stage. The semantics are
// child-protective for the RTE case (an EWS reject is only routed here so a human can review it):
//
//	requested reject + APPROVE  → denied   (the reviewer upholds the rejection)
//	requested reject + REJECT   → admitted (the reviewer overturns it in the child's favour; credential issued)
//	requested admit  + APPROVE  → admitted (credential issued by the HITL executor)
//	requested admit  + REJECT   → denied
//
// The officer must hold the admission.decide scope (enforced by the HITL queue, fail-closed).
func (p *Platform) FinaliseAdmission(ctx context.Context, requestID string, approve bool, officer string) (AdmissionApplication, error) {
	req, ok := p.Queue.Get(requestID)
	if !ok {
		return AdmissionApplication{}, errors.New("admission: HITL request not found")
	}
	applicantID, _ := req.Args["applicantId"].(string)
	decision, _ := req.Args["decision"].(string)
	name, _ := req.Args["applicantName"].(string)
	category, _ := req.Args["category"].(string)
	tenant, _ := req.Args["tenant"].(string)
	if applicantID == "" {
		return AdmissionApplication{}, errors.New("admission: request carries no applicant id")
	}

	// the HITL queue runs the executor on approve (issuing the credential when decision==admit) and enforces the
	// admission.decide scope.
	if _, err := p.Queue.Decide(ctx, requestID, approve, hitl.Approver{ID: officer, Scopes: []string{"admission.decide"}}); err != nil {
		return AdmissionApplication{}, err
	}

	app, found := admissionState().Get(applicantID)
	if !found {
		app = AdmissionApplication{ID: applicantID, Category: category, Tenant: tenant, Decision: decision, PIISealed: true}
	}

	admitted := (approve && decision == "admit") || (!approve && decision == "reject")
	if admitted {
		app.Stage, app.Effect = "admitted", "permit"
		app.CredentialID = "ADM-" + applicantID
		// the overturn-to-admit path did NOT run the executor, so mint+anchor the credential here.
		if !approve && decision == "reject" {
			if _, err := p.issueAdmissionCredential(tenant, applicantID, name, category); err != nil {
				return AdmissionApplication{}, err
			}
		}
	} else {
		app.Stage, app.Effect = "denied", "deny"
		app.CredentialID = ""
	}
	app.RequestID = ""
	app.DecidedAt = p.now()
	_ = admissionState().Record(app)
	p.appendAudit("officer:"+officer, "admission.finalise", applicantID, app.Stage, "by "+officer)
	return app, nil
}
