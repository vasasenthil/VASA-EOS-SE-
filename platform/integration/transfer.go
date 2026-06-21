package integration

import (
	"context"

	"github.com/vasa-eos-se-tn/platform/credentials"
	"github.com/vasa-eos-se-tn/platform/reconcile"
)

// TransferRequest moves a learner from one school to another within the estate.
type TransferRequest struct {
	APAARID   string `json:"apaar_id"`
	FromUDISE string `json:"from_udise"`
	ToUDISE   string `json:"to_udise"`
	Class     string `json:"class"`
}

// TransferOutcome is the result of a portability transfer.
type TransferOutcome struct {
	APAARID          string                          `json:"apaar_id"`
	FromUDISE        string                          `json:"from_udise"`
	ToUDISE          string                          `json:"to_udise"`
	FromDistrict     string                          `json:"from_district,omitempty"`
	ToDistrict       string                          `json:"to_district,omitempty"`
	OldCredRevoked   string                          `json:"old_credential_revoked,omitempty"`
	NewCredential    *credentials.AnchoredCredential `json:"new_credential,omitempty"`
	Transferred      bool                            `json:"transferred"`
	Refused          bool                            `json:"refused"`
	Reason           string                          `json:"reason,omitempty"`
	HistoryPreserved bool                            `json:"history_preserved"` // the APAAR journey carries across
	AuditSeq         uint64                          `json:"audit_seq"`
}

// activeEnrolmentAt finds the learner's current (non-revoked) EnrolmentRecord credential id at a given school
// (or the most recent active enrolment when udise is empty).
func (p *Platform) activeEnrolmentAt(apaarID, udise string) string {
	p.walletMu.Lock()
	creds := append([]credentials.AnchoredCredential(nil), p.wallet[apaarID]...)
	p.walletMu.Unlock()
	last := ""
	for _, ac := range creds {
		c := ac.Signed.Credential
		if c.Type != "EnrolmentRecord" {
			continue
		}
		if _, revoked := p.RevocationStatus(c.ID); revoked {
			continue
		}
		if udise == "" || c.Claims["udise"] == udise {
			last = c.ID
		}
	}
	return last
}

// TransferStudent moves a learner between schools while preserving their journey: it validates the destination
// school exists in the estate, REVOKES the old enrolment credential, issues a fresh enrolment credential at the
// new school (the same APAAR id, so wallet + journey + lawful basis all carry across), and audits the move.
// The learner does not "start over" — their history (audit timeline + wallet, incl. the revoked prior
// enrolment) travels with the APAAR id.
func (p *Platform) TransferStudent(ctx context.Context, req TransferRequest) TransferOutcome {
	out := TransferOutcome{APAARID: req.APAARID, FromUDISE: req.FromUDISE, ToUDISE: req.ToUDISE}

	// destination must be a real T6 school in the sovereign estate.
	if node, ok := p.TenantNode(req.ToUDISE); !ok || node.Level != 6 {
		out.Refused, out.Reason = true, "unknown destination school"
		return out
	}
	// the learner must currently be enrolled (a non-revoked enrolment credential on file).
	oldCred := p.activeEnrolmentAt(req.APAARID, req.FromUDISE)
	if oldCred == "" {
		out.Refused, out.Reason = true, "no active enrolment to transfer for this learner"
		return out
	}
	if req.FromUDISE == req.ToUDISE {
		out.Refused, out.Reason = true, "source and destination are the same school"
		return out
	}

	out.FromDistrict = p.tenancyAncestorAtLevel(req.FromUDISE, 3)
	out.ToDistrict = p.tenancyAncestorAtLevel(req.ToUDISE, 3)

	// revoke the prior enrolment (kept in the wallet, flagged revoked) and issue the new one.
	rev := p.RevokeCredential(oldCred, "APAAR-Transfer", "transferred to "+req.ToUDISE)
	out.OldCredRevoked = rev.CredentialID

	apaar := reconcile.ApaarRecord{ApaarID: req.APAARID, Category: "GEN", JourneyStatus: "transferred"}
	cred, err := p.issueEnrolmentCredential(apaar, req.ToUDISE, req.Class)
	if err != nil {
		out.Refused, out.Reason = true, "new enrolment credential failed: "+err.Error()
		return out
	}
	out.NewCredential = &cred
	out.Transferred = true
	out.HistoryPreserved = true // same APAAR id → journey + wallet (incl. the revoked prior enrolment) carry across
	p.appendAudit("system", "enrol.transfer", req.APAARID, "transferred", req.FromUDISE+"→"+req.ToUDISE)
	out.AuditSeq = uint64(p.Audit.Len())
	return out
}
