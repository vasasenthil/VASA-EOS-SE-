package integration

import (
	"context"

	"github.com/vasa-eos-se-tn/platform/loop"
)

// loopAudit adapts the platform audit chain to loop.AuditSink (3-arg Record).
type loopAudit struct{ p *Platform }

func (a loopAudit) Record(kind, action, detail string) {
	a.p.appendAudit("agent-loop", "loop."+kind, action, "", detail)
}

// RunLoop runs the L9 bounded Plan→Execute→Verify→Reflect controller (the "Loop Engineering" discipline) for
// a goal, auditing every step through the platform's audit chain. A consequential action (needsHITL) pauses
// at a human-in-the-loop checkpoint rather than executing autonomously.
func (p *Platform) RunLoop(ctx context.Context, goal string, planner loop.Planner, tool loop.Tool, critic loop.Critic, needsHITL func(action string) bool) (loop.Result, error) {
	e, err := loop.New(planner, tool, critic, loop.Config{MaxSteps: 8, NeedsHITL: needsHITL}, loopAudit{p})
	if err != nil {
		return loop.Result{}, err
	}
	res := e.Run(ctx, goal)
	p.recordOutcome(true)
	return res, nil
}
