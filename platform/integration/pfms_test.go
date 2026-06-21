package integration

import (
	"context"
	"testing"

	"github.com/vasa-eos-se-tn/platform/reconcile"
)

func TestPFMSReconcileCleanAndDrift(t *testing.T) {
	p := newPlatform(t)
	const ben = "SYN-APAAR-000000000011"
	p.RecordSubsidyBasis("B-11", ben)
	// deliver ₹2000 → local ledger released/utilised = 2000.
	out := p.DeliverDBT(context.Background(), DBTRequest{Scheme: "PUDHUMAI-PENN", Beneficiary: ben, AmountINR: 2000, HighStakes: false})
	if !out.Delivered {
		t.Fatalf("delivery should succeed: %+v", out)
	}
	// upstream PFMS agrees exactly → clean reconciliation.
	clean := p.ReconcilePFMS("PUDHUMAI-PENN", reconcile.PfmsExpenditure{Allocated: 2000, Released: 2000, Utilised: 2000})
	if !clean.Clean || clean.CriticalDriftCount != 0 {
		t.Fatalf("matching figures must reconcile clean: %+v", clean)
	}
	// upstream PFMS shows less utilised than the local ledger → drift surfaced (potential leakage).
	drift := p.ReconcilePFMS("PUDHUMAI-PENN", reconcile.PfmsExpenditure{Allocated: 2000, Released: 2000, Utilised: 1000})
	if drift.Clean || drift.CriticalDriftCount == 0 {
		t.Fatalf("a money mismatch must surface critical drift: %+v", drift)
	}
	if drift.Rationale == "" {
		t.Fatal("a drift must carry a human-readable rationale")
	}
}
