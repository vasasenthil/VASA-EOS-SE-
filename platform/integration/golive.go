package integration

import (
	"context"

	"github.com/vasa-eos-se-tn/platform/cutover"
)

// cutoverAudit adapts the L5 audit log to the cutover.AuditSink interface (3-arg Record).
type cutoverAudit struct {
	log interface {
		Record(event, actor, resource, detail string)
	}
}

func (c cutoverAudit) Record(event, step, detail string) {
	c.log.Record(event, "cutover", step, detail)
}

// GoLive runs an ordered, idempotent, reversible cutover under the operations cutover engine, auditing every
// transition through the platform's L5 audit chain. A failure rolls the completed steps back automatically.
func (p *Platform) GoLive(ctx context.Context, steps []cutover.Step) (cutover.Result, error) {
	plan, err := cutover.NewPlan(steps, cutoverAudit{log: hitlAudit{log: p.Audit, now: p.now}})
	if err != nil {
		return cutover.Result{}, err
	}
	return plan.Run(ctx), nil
}
