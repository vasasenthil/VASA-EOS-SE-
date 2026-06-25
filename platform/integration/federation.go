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

// ReconcileFunds runs L4 fund-flow reconciliation: it fetches PFMS figures through the resilient adapter,
// compares them to the local scheme ledger (tight money tolerance), and audits the advisory verdict.
func (p *Platform) ReconcileFunds(ctx context.Context, client *adapters.PFMSClient, scheme string, local *reconcile.FundLedger) (reconcile.NumericReport, error) {
	rep, err := client.Reconcile(ctx, scheme, local)
	if err != nil {
		p.appendAudit("federation:pfms", "federation.reconcile.error", scheme, "error", err.Error())
		p.recordOutcome(false)
		return reconcile.NumericReport{}, err
	}
	p.appendAudit("federation:pfms", "federation.reconcile", scheme, string(rep.Recommendation), rep.Rationale)
	p.recordOutcome(true)
	return rep, nil
}

// ReconcileSchoolCounts runs L4 UDISE+/EMIS reconciliation: it fetches the EMIS school master through the
// resilient adapter, compares its student count to the local on-roll figure, and audits the verdict.
func (p *Platform) ReconcileSchoolCounts(ctx context.Context, client *adapters.UDISEClient, udise string, localOnRoll *int) (reconcile.NumericReport, error) {
	rep, err := client.Reconcile(ctx, udise, localOnRoll)
	if err != nil {
		p.appendAudit("federation:udise", "federation.reconcile.error", udise, "error", err.Error())
		p.recordOutcome(false)
		return reconcile.NumericReport{}, err
	}
	p.appendAudit("federation:udise", "federation.reconcile", udise, string(rep.Recommendation), rep.Rationale)
	p.recordOutcome(true)
	return rep, nil
}
