package integration

import (
	"context"

	"github.com/vasa-eos-se-tn/platform/adapters"
	"github.com/vasa-eos-se-tn/platform/reconcile"
)

// ReconcileStudent runs the L4 federation reconciliation: it fetches the upstream APAAR record through the
// resilient anti-corruption adapter, compares it to the local master, and audits the advisory verdict
// (Reconciled / Review / Flagged). The platform federates with the source of truth and makes drift visible.
func (p *Platform) ReconcileStudent(ctx context.Context, client *adapters.APAARClient, apaarID string, local reconcile.StudentRecord) (reconcile.Report, error) {
	rep, err := client.Reconcile(ctx, apaarID, local)
	if err != nil {
		p.appendAudit("federation:apaar", "federation.reconcile.error", apaarID, "error", err.Error())
		p.recordOutcome(false)
		return reconcile.Report{}, err
	}
	p.appendAudit("federation:apaar", "federation.reconcile", apaarID, string(rep.Recommendation), rep.Rationale)
	p.recordOutcome(true)
	return rep, nil
}
