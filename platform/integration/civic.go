package integration

import (
	"context"
	"fmt"
	"strings"

	"github.com/vasa-eos-se-tn/platform/adapters"
	"github.com/vasa-eos-se-tn/platform/pep"
)

// FetchLearnerCredentials lists a learner's DigiLocker-held credentials through the resilient adapter, audited.
func (p *Platform) FetchLearnerCredentials(ctx context.Context, client *adapters.DigiLockerClient, apaarID string) ([]adapters.CredentialDoc, error) {
	docs, err := client.GetCredentials(ctx, apaarID)
	if err != nil {
		p.appendAudit("federation:digilocker", "federation.fetch.error", apaarID, "error", err.Error())
		p.recordOutcome(false)
		return nil, err
	}
	p.appendAudit("federation:digilocker", "federation.fetch.credentials", apaarID, "ok", fmt.Sprintf("%d docs", len(docs)))
	p.recordOutcome(true)
	return docs, nil
}

// FetchLearningResource fetches a DIKSHA content item through the resilient adapter, audited.
func (p *Platform) FetchLearningResource(ctx context.Context, client *adapters.DIKSHAClient, id string) (adapters.LearningResource, error) {
	res, err := client.GetResource(ctx, id)
	if err != nil {
		p.appendAudit("federation:diksha", "federation.fetch.error", id, "error", err.Error())
		p.recordOutcome(false)
		return adapters.LearningResource{}, err
	}
	p.appendAudit("federation:diksha", "federation.fetch.resource", id, "ok", res.Title)
	p.recordOutcome(true)
	return res, nil
}

// RTIDisclosure adjudicates a Right-to-Information disclosure through the PEP (the RTI Rego bundle, L12 civic):
// exempt categories are denied; third-party information requires a PIO review; otherwise it is permitted.
func (p *Platform) RTIDisclosure(ctx context.Context, pioRole, infoID, exemptCategory string, thirdParty bool) pep.Decision {
	dec := p.PEP.Authorize(ctx, pep.Request{
		Subject:  pep.Subject{Role: pioRole},
		Action:   "rti.disclose",
		Resource: pep.Resource{Type: "rti-record", ID: infoID, Attributes: map[string]any{"exempt_category": exemptCategory, "third_party": thirdParty}},
	})
	p.appendAudit("role:"+pioRole, "rti.disclose", infoID, string(dec.Effect), strings.Join(dec.Reasons, ","))
	return dec
}
