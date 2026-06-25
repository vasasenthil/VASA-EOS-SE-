// Package agentregistry is the L9 agent + tool registry (CC-SPEC-001 §5, §10.9).
//
// The platform has 6 native-AI agents that compose the 6 engines into role-facing recommendations — every
// one ADVISORY, under human authority (a PORT of the reference agent layer). An agent never acts on its own:
// it proposes a tool call, and a side-effecting tool only runs after the human-in-the-loop approves it
// (see the hitl package). This registry holds the agent specs and the MCP-style tool catalogue, where each
// tool declares its RISK and the governance SCOPE a human must hold to approve it. Pure + stdlib-only.
package agentregistry

import (
	"errors"
	"fmt"
)

// AgentID identifies one of the six agents.
type AgentID string

const (
	Policy     AgentID = "policy"
	Teacher    AgentID = "teacher"
	Student    AgentID = "student"
	Governance AgentID = "governance"
	Grievance  AgentID = "grievance"
	Compliance AgentID = "compliance"
)

// AgentSpec is the brochure's five-part agent anatomy plus its stakes flag.
type AgentSpec struct {
	ID         AgentID
	Label      string
	Goal       string
	Perception string
	Action     string
	Oversight  string
	HighStakes bool // high-stakes agents always route their proposals through human approval
}

// Agents is the canonical registry of the six agents.
var Agents = []AgentSpec{
	{Policy, "Policy Agent", "Advise a sanctioning authority on a policy lever's impact.", "Policy lever + population baseline", "Proposes a projected coverage/cost/equity note", "Sanction requires a human authority", true},
	{Teacher, "Teacher Agent", "Turn assessment results into a remediation plan.", "Rubric, responses, syllabus, mastery", "Diagnoses weak objectives + recommends next steps", "The teacher decides what to teach", false},
	{Student, "Student Agent", "Guide a learner to their next objective and answer questions.", "Learner mastery, syllabus, a question, corpus", "Recommends next objective + a grounded answer", "Advisory to the learner and teacher", false},
	{Governance, "Governance Agent", "Surface risk in an indicator for an officer.", "An indicator series + optional rules/facts", "Flags anomalies + derives conclusions", "The officer investigates and decides", false},
	{Grievance, "Grievance Agent", "Recommend routing and cite the governing policy.", "Grievance facts + a query + corpus", "Proposes a tier + a cited policy basis", "The tier officer resolves or escalates", false},
	{Compliance, "Compliance Agent", "Derive compliance findings from school facts.", "School facts + compliance rules", "Lists findings (RTE/RPwD/DPDP/POCSO)", "A compliance officer signs off", true},
}

// Spec returns the spec for an agent id.
func Spec(id AgentID) (AgentSpec, error) {
	for _, a := range Agents {
		if a.ID == id {
			return a, nil
		}
	}
	return AgentSpec{}, fmt.Errorf("agentregistry: unknown agent %q", id)
}

// Risk is a tool's risk tier.
type Risk int

const (
	Low    Risk = iota // read-only / advisory; may auto-proceed
	Medium             // limited side effects; auto-proceed only with high confidence
	High               // financial / legal / safety side effects; ALWAYS requires human approval
)

func (r Risk) String() string {
	switch r {
	case Low:
		return "low"
	case Medium:
		return "medium"
	case High:
		return "high"
	default:
		return "unknown"
	}
}

// Tool is an MCP-style tool an agent may call.
type Tool struct {
	Name          string
	Risk          Risk
	RequiredScope string // the governance scope a human approver must hold (e.g. "fund.release", "compliance.sign")
	SideEffecting bool
}

// Registry is the tool catalogue.
type Registry struct {
	tools map[string]Tool
}

// NewRegistry builds a registry seeded with the platform's core agent tools.
func NewRegistry() *Registry {
	r := &Registry{tools: map[string]Tool{}}
	for _, t := range []Tool{
		{"answer_query", Low, "", false},
		{"recommend_objective", Low, "", false},
		{"flag_anomaly", Low, "", false},
		{"diagnose_mastery", Low, "", false},
		{"recommend_routing", Medium, "grievance.route", true},
		{"flag_violation", High, "compliance.sign", true},
		{"initiate_dbt", High, "fund.release", true},
		{"sanction_lever", High, "policy.sanction", true},
	} {
		r.tools[t.Name] = t
	}
	return r
}

// Register adds or replaces a tool. SideEffecting High-risk tools must declare a RequiredScope.
func (r *Registry) Register(t Tool) error {
	if t.Name == "" {
		return errors.New("agentregistry: tool name required")
	}
	if t.Risk == High && t.RequiredScope == "" {
		return fmt.Errorf("agentregistry: high-risk tool %q must declare a RequiredScope", t.Name)
	}
	r.tools[t.Name] = t
	return nil
}

// Lookup returns a tool by name.
func (r *Registry) Lookup(name string) (Tool, error) {
	t, ok := r.tools[name]
	if !ok {
		return Tool{}, fmt.Errorf("agentregistry: unknown tool %q", name)
	}
	return t, nil
}

// Len reports the number of registered tools.
func (r *Registry) Len() int { return len(r.tools) }
