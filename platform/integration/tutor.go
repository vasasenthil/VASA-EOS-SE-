package integration

import (
	"context"
	"strings"

	"github.com/vasa-eos-se-tn/platform/serving"
)

// TutorRequest is a learner's question entering at the surface.
type TutorRequest struct {
	Tenant         string
	Question       string
	Minor          bool
	AgeAppropriate bool
	Mastered       map[string]bool // concept ids the learner has mastered
	Target         string          // the concept they want to learn next
}

// TutorResult is the outcome of the end-to-end tutoring workflow.
type TutorResult struct {
	Stage    string
	Refused  bool
	Reasons  []string
	Answer   string
	Ready    bool     // is the learner ready for Target?
	Missing  []string // prerequisites not yet mastered
	NextPath []string // the topological learning path to Target
	AuditSeq uint64
}

// AskTutor runs the full bottom-to-top tutoring workflow, ascending the layers:
// L10 rate-limit → L8 serving (guardrails + safety gate + oracle) → L7 knowledge graph → L5 audit.
func (p *Platform) AskTutor(ctx context.Context, req TutorRequest) (TutorResult, error) {
	var res TutorResult

	// L10 — rate limit.
	if !p.Limiter.Allow(req.Tenant) {
		res.Stage, res.Reasons = "rate-limited", []string{"RATE-LIMIT"}
		p.recordOutcome(false)
		return res, nil
	}

	// L8 — guarded inference: PII is redacted, the prompt is adjudicated, the oracle baseline serves.
	resp, err := p.Tutor.Generate(ctx, serving.Request{Prompt: req.Question, Minor: req.Minor, AgeAppropriate: req.AgeAppropriate})
	if err != nil {
		p.recordOutcome(false)
		return res, err
	}
	if resp.Refused {
		res.Stage, res.Refused, res.Reasons = "refused", true, resp.Reasons
		p.appendAudit("learner", "ai.tutor.refused", req.Target, "deny", strings.Join(resp.Reasons, ","))
		p.recordOutcome(true) // a correct refusal is a successful safety outcome
		return res, nil
	}
	res.Answer = resp.Text

	// L7 — knowledge graph: readiness + the topological learning path.
	if req.Target != "" {
		ready, missing, gerr := p.Graph.Ready(req.Mastered, req.Target)
		if gerr != nil {
			p.recordOutcome(false)
			return res, gerr
		}
		res.Ready, res.Missing = ready, missing
		if path, perr := p.Graph.LearningPath(req.Target); perr == nil {
			for _, c := range path {
				res.NextPath = append(res.NextPath, c.ID)
			}
		}
	}

	// L5 — audit.
	rec := p.appendAudit("learner", "ai.tutor.served", req.Target, "permit", "")
	res.Stage, res.AuditSeq = "served", rec.Seq
	p.recordOutcome(true)
	return res, nil
}
