// Package agents implements the 6 native-AI agents (CC-SPEC-001 §5, brochure pillar "6 AI Agents"). Each
// agent COMPOSES one or more engines into a role-facing recommendation — every one ADVISORY, under human
// authority (a RE-AUTHOR of lib/ai/agents). An agent never acts: it returns a Recommendation whose
// RequiresApproval flag (set when the agent is high-stakes or its confidence is low) tells the orchestrator
// whether the proposal may auto-proceed or must go to the human-in-the-loop queue. Stdlib-only.
package agents

import (
	"fmt"
	"strings"

	"github.com/vasa-eos-se-tn/platform/engines"
)

// ConfidenceThreshold: below this, even a low-stakes recommendation routes to a human.
const ConfidenceThreshold = 0.7

// Recommendation is an agent's advisory output.
type Recommendation struct {
	Agent            string
	Summary          string
	Detail           string
	Confidence       float64
	HighStakes       bool
	RequiresApproval bool // HighStakes OR Confidence < ConfidenceThreshold
}

func finalize(agent, summary, detail string, confidence float64, highStakes bool) Recommendation {
	if confidence < 0 {
		confidence = 0
	}
	if confidence > 1 {
		confidence = 1
	}
	return Recommendation{
		Agent: agent, Summary: summary, Detail: detail, Confidence: confidence, HighStakes: highStakes,
		RequiresApproval: highStakes || confidence < ConfidenceThreshold,
	}
}

// Teacher composes Assessment + Personalisation into a remediation plan (low-stakes).
func Teacher(rubric []engines.RubricItem, resp []engines.Response, candidates []string) Recommendation {
	a := engines.Assess(rubric, resp)
	mastery := map[string]float64{}
	for _, m := range a.Mastery {
		mastery[m.Objective] = m.Pct / 100
	}
	next := engines.NextBest(mastery, candidates, 0.5)
	var objs []string
	for _, n := range next {
		objs = append(objs, n.Objective)
	}
	summary := fmt.Sprintf("Scored %.0f%% (band %s); remediate: %s", a.Pct, a.Band, strings.Join(objs, ", "))
	if len(objs) == 0 {
		summary = fmt.Sprintf("Scored %.0f%% (band %s); no remediation needed", a.Pct, a.Band)
	}
	// confidence rises with how much of the rubric was actually attempted (here: overall attainment proxy)
	return finalize("teacher", summary, strings.Join(a.Weak, ","), 0.6+0.4*(a.Pct/100), false)
}

// Student composes Personalisation + Conversational into a next-objective + a grounded answer (low-stakes).
func Student(mastery map[string]float64, candidates []string, query string, corpus []engines.Doc) Recommendation {
	next := engines.NextBest(mastery, candidates, 0.8)
	ans := engines.Converse(query, corpus)
	target := "none"
	if len(next) > 0 {
		target = next[0].Objective
	}
	conf := 0.5
	if ans.Grounded {
		conf = 0.85
	}
	return finalize("student", "Next: "+target+"; "+ans.Text, strings.Join(ans.Citations, ","), conf, false)
}

// Governance composes Analytics into an anomaly flag for an officer (low-stakes).
func Governance(series []float64) Recommendation {
	an := engines.Anomalies(series, engines.DefaultZ)
	if len(an) == 0 {
		return finalize("governance", "No anomalies detected", "", 0.9, false)
	}
	var idx []string
	for _, a := range an {
		idx = append(idx, fmt.Sprintf("#%d=%.0f(z%.1f)", a.Index, a.Value, a.Z))
	}
	return finalize("governance", fmt.Sprintf("%d anomaly point(s): %s", len(an), strings.Join(idx, " ")), "", 0.8, false)
}

// Grievance composes Conversational (cite the policy) into a routing recommendation (low-stakes, but low
// confidence when ungrounded → routes to a human).
func Grievance(query string, corpus []engines.Doc) Recommendation {
	ans := engines.Converse(query, corpus)
	if !ans.Grounded {
		return finalize("grievance", "No governing policy found; escalate for manual routing", "", 0.4, false)
	}
	return finalize("grievance", "Route per "+strings.Join(ans.Citations, ", "), ans.Text, 0.8, false)
}

// Policy composes the Policy engine into a sanction recommendation (HIGH-STAKES → always human-approved).
func Policy(b engines.Baseline, l engines.Lever) Recommendation {
	p := engines.Project(b, l)
	summary := fmt.Sprintf("%s → coverage %.1f%%→%.1f%% (+%d), cost %.0f, equity %.2f",
		l.Name, b.CurrentCoverage*100, p.NewCoverage*100, p.NewlyCovered, p.Cost, p.EquityScore)
	return finalize("policy", summary, "", 0.8, true)
}

// Compliance composes Reasoning over school facts into findings (HIGH-STAKES → always human-approved).
func Compliance(facts []engines.Fact, rules []engines.Rule) Recommendation {
	d := engines.Reason(facts, rules)
	var findings []string
	for _, x := range d {
		findings = append(findings, x.Fact.Key+"="+x.Fact.Value)
	}
	summary := "No findings"
	if len(findings) > 0 {
		summary = fmt.Sprintf("%d finding(s): %s", len(findings), strings.Join(findings, ", "))
	}
	return finalize("compliance", summary, "", 0.85, true)
}
