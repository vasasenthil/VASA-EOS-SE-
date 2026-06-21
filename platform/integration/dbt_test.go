package integration

import (
	"context"
	"testing"
)

func TestDeliverDBTEndToEnd(t *testing.T) {
	p := newPlatform(t)
	const ben = "SYN-APAAR-000000000007"
	// no lawful basis yet → fail-closed refusal (no money moves without a DPDP basis).
	if out := p.DeliverDBT(context.Background(), DBTRequest{Scheme: "PUDHUMAI-PENN", Beneficiary: ben, AmountINR: 1000, HighStakes: true}); !out.Refused || out.LawfulBasis {
		t.Fatalf("a benefit with no lawful basis must be refused: %+v", out)
	}
	// record the §7 subsidy basis, then deliver end-to-end.
	if _, err := p.RecordSubsidyBasis("B-7", ben); err != nil {
		t.Fatal(err)
	}
	before := p.Audit.Len()
	out := p.DeliverDBT(context.Background(), DBTRequest{Scheme: "PUDHUMAI-PENN", Beneficiary: ben, AmountINR: 1500, HighStakes: true})
	if out.Refused || !out.Delivered {
		t.Fatalf("a lawful, sanctioned DBT must be delivered: %+v", out)
	}
	if !out.LawfulBasis || !out.Sanctioned {
		t.Fatalf("delivery must record lawful basis + sanction: %+v", out)
	}
	// high-stakes → escalated through the Cabinet (G1).
	if len(out.Escalation) == 0 || out.Escalation[len(out.Escalation)-1] != "G1" {
		t.Fatalf("a high-stakes DBT must escalate to G1, got %v", out.Escalation)
	}
	// funds released + a verifiable receipt minted, and the ledger reflects it.
	if out.Released != 1500 || out.Utilised != 1500 || out.Receipt == nil {
		t.Fatalf("funds must be released + a receipt issued: %+v", out)
	}
	if l := p.FundLedger("PUDHUMAI-PENN"); l.Released != 1500 {
		t.Fatalf("the scheme ledger must record the release, got %+v", l)
	}
	if p.Audit.Len() <= before {
		t.Fatal("delivery must extend the audit chain")
	}
}

func TestDeliverDBTUnknownScheme(t *testing.T) {
	p := newPlatform(t)
	p.RecordSubsidyBasis("B-9", "SYN-APAAR-000000000009")
	out := p.DeliverDBT(context.Background(), DBTRequest{Scheme: "NOT-A-SCHEME", Beneficiary: "SYN-APAAR-000000000009", AmountINR: 500})
	if !out.Refused || out.Reason == "" {
		t.Fatalf("an unknown scheme must be refused: %+v", out)
	}
}
