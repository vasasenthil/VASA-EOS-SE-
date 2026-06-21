package integration

import (
	"context"
	"fmt"

	"github.com/vasa-eos-se-tn/platform/consent"
	"github.com/vasa-eos-se-tn/platform/credentials"
	"github.com/vasa-eos-se-tn/platform/reconcile"
	"github.com/vasa-eos-se-tn/platform/seed"
	"github.com/vasa-eos-se-tn/platform/workflow"
)

// DBTRequest is a scheme benefit to deliver to a beneficiary.
type DBTRequest struct {
	Scheme      string  `json:"scheme"`      // a scheme code from the seeded catalogue
	Beneficiary string  `json:"beneficiary"` // the learner's APAAR id
	AmountINR   float64 `json:"amount_inr"`
	HighStakes  bool    `json:"high_stakes"` // large/novel disbursement → escalates to the Cabinet
}

// DBTOutcome is the end-to-end result of a scheme-DBT delivery.
type DBTOutcome struct {
	Scheme      string                          `json:"scheme"`
	Beneficiary string                          `json:"beneficiary"`
	Amount      float64                         `json:"amount_inr"`
	Delivered   bool                            `json:"delivered"`
	Refused     bool                            `json:"refused"`
	Reason      string                          `json:"reason,omitempty"`
	LawfulBasis bool                            `json:"lawful_basis"`
	Sanctioned  bool                            `json:"sanctioned"`
	Escalation  []string                        `json:"escalation"` // the G-tiers the sanction passed
	Released    float64                         `json:"released_total"`
	Utilised    float64                         `json:"utilised_total"`
	Receipt     *credentials.AnchoredCredential `json:"receipt,omitempty"`
	AuditSeq    uint64                          `json:"audit_seq"`
}

// schemeExists reports whether a scheme code is in the seeded catalogue.
func schemeExists(code string) bool {
	for _, s := range seed.Schemes {
		if s.Code == code {
			return true
		}
	}
	return false
}

// ledgerFor returns (creating if needed) the local fund ledger for a scheme.
func (p *Platform) ledgerFor(scheme string) *reconcile.FundLedger {
	p.fundsMu.Lock()
	defer p.fundsMu.Unlock()
	l := p.Funds[scheme]
	if l == nil {
		l = &reconcile.FundLedger{}
		p.Funds[scheme] = l
	}
	return l
}

// DeliverDBT runs a scheme benefit end-to-end (G-tier sanction → fund release → beneficiary credit → verifiable
// receipt), each step audited. It is fail-closed: an unknown scheme, a missing DPDP lawful basis (§7 subsidy)
// for the beneficiary, or a sanction that does not reach approval all refuse the disbursement — no money moves
// without a lawful basis and a completed governance sanction.
func (p *Platform) DeliverDBT(ctx context.Context, req DBTRequest) DBTOutcome {
	out := DBTOutcome{Scheme: req.Scheme, Beneficiary: req.Beneficiary, Amount: req.AmountINR}

	if !schemeExists(req.Scheme) {
		out.Refused, out.Reason = true, "unknown scheme code"
		return out
	}
	if req.AmountINR <= 0 {
		out.Refused, out.Reason = true, "amount must be positive"
		return out
	}
	// §E DPDP: a benefit may be disbursed only on a recorded lawful basis (a §7 subsidy/legal-obligation grant).
	if ok, _ := p.Consent.HasLawfulBasis(req.Beneficiary, "scheme-dbt"); !ok {
		out.Refused, out.Reason = true, "no DPDP lawful basis (scheme-dbt) on file for the beneficiary"
		return out
	}
	out.LawfulBasis = true

	// L11/L6: the disbursement is sanctioned through the govtiers escalation (driven by the register).
	id := "DBT-" + req.Scheme + "-" + req.Beneficiary
	in, err := p.StartSanction(id, req.HighStakes)
	if err != nil {
		out.Refused, out.Reason = true, "sanction could not start: "+err.Error()
		return out
	}
	for _, tier := range p.SanctionEscalation(req.HighStakes) {
		out.Escalation = append(out.Escalation, tier.Code)
		if err := p.ActSanction(in, req.HighStakes, workflow.Approve, tier.ApproverRole+"-1", tier.ApproverRole, []string{tier.RequiredScope}, "DBT sanction "+req.Scheme); err != nil {
			out.Refused, out.Reason = true, fmt.Sprintf("sanction stalled at %s: %v", tier.Code, err)
			return out
		}
	}
	if in.Status != workflow.Approved {
		out.Refused, out.Reason = true, "sanction not approved"
		return out
	}
	out.Sanctioned = true

	// L4/L3: release the funds to the beneficiary on the local ledger (reconciled against PFMS when live).
	l := p.ledgerFor(req.Scheme)
	p.fundsMu.Lock()
	l.Allocated += req.AmountINR
	l.Released += req.AmountINR
	l.Utilised += req.AmountINR
	out.Released, out.Utilised = l.Released, l.Utilised
	p.fundsMu.Unlock()

	// L7: a verifiable, notarised DBT receipt credential for the beneficiary.
	receipt, err := p.issueDBTReceipt(req.Scheme, req.Beneficiary, req.AmountINR)
	if err != nil {
		out.Refused, out.Reason = true, "receipt issuance failed: "+err.Error()
		return out
	}
	out.Receipt = &receipt
	out.Delivered = true
	p.appendAudit("system", "dbt.deliver", id, "delivered", fmt.Sprintf("%s INR %.0f", req.Scheme, req.AmountINR))
	out.AuditSeq = uint64(p.Audit.Len())
	return out
}

// issueDBTReceipt mints a verifiable, notarised benefit-receipt credential.
func (p *Platform) issueDBTReceipt(scheme, beneficiary string, amount float64) (credentials.AnchoredCredential, error) {
	c := credentials.Credential{
		ID: "DBT-" + scheme + "-" + beneficiary, Type: "BenefitReceipt", Subject: beneficiary,
		Issuer: "PFMS-TamilNadu", IssuedAt: p.now(),
		Claims: map[string]string{"scheme": scheme, "amount_inr": fmt.Sprintf("%.0f", amount), "status": "disbursed"},
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

// RecordSubsidyBasis records the §7 subsidy lawful basis a beneficiary needs before a benefit can be delivered.
func (p *Platform) RecordSubsidyBasis(grantID, beneficiary string) (consent.Grant, error) {
	return p.Consent.Grant(grantID, beneficiary, "scheme-dbt", consent.Subsidy, true, "guardian")
}

// FundLedger returns the local fund-flow figures for a scheme (allocated/released/utilised).
func (p *Platform) FundLedger(scheme string) reconcile.FundLedger {
	p.fundsMu.Lock()
	defer p.fundsMu.Unlock()
	if l := p.Funds[scheme]; l != nil {
		return *l
	}
	return reconcile.FundLedger{}
}
