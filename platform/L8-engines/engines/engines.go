// Package engines implements the 6 deterministic AI engine baselines (CC-SPEC-001 §5, brochure pillar
// "6 AI Engines"): Reasoning · Personalisation · Assessment · Policy · Analytics · Conversational.
//
// These are RE-AUTHORs of the reference engines (lib/ai/engines): pure, explainable, deterministic functions.
// In production the LLM-served models (vLLM/Triton, B-011) sit behind the serving gateway; THESE engines are
// the baselines/oracles that the gateway falls back to and that evaluation grades the served models against.
// Every engine is advisory — it informs a human, never acts. Stdlib-only.
package engines

import (
	"math"
	"sort"
	"strings"
)

// ── Engine 1 · Reasoning (forward-chaining rule inference) ──────────────────

// Fact is a key/value the reasoner knows or derives.
type Fact struct{ Key, Value string }

// Rule fires Then when every When key/value is present in the fact base.
type Rule struct {
	When    map[string]string
	Then    Fact
	Because string
}

// Derivation records a fired rule (for the explanation).
type Derivation struct {
	Fact    Fact
	Because string
}

// Reason forward-chains rules over facts to a fixpoint, returning the derived facts and a trace.
func Reason(facts []Fact, rules []Rule) (derived []Derivation) {
	known := map[string]string{}
	for _, f := range facts {
		known[f.Key] = f.Value
	}
	changed := true
	for changed {
		changed = false
		for _, r := range rules {
			if _, have := known[r.Then.Key]; have {
				continue
			}
			matched := true
			for k, v := range r.When {
				if known[k] != v {
					matched = false
					break
				}
			}
			if matched {
				known[r.Then.Key] = r.Then.Value
				derived = append(derived, Derivation{Fact: r.Then, Because: r.Because})
				changed = true
			}
		}
	}
	return derived
}

// ── Engine 2 · Assessment (rubric scoring + mastery) ────────────────────────

// RubricItem is one scorable item tagged with a learning objective.
type RubricItem struct {
	ID        string
	Marks     float64
	Objective string
}

// Response is a learner's awarded marks for an item.
type Response struct {
	ItemID  string
	Awarded float64
}

// Mastery is per-objective attainment.
type Mastery struct {
	Objective    string
	Awarded, Max float64
	Pct          float64
}

// AssessmentResult is the scored outcome.
type AssessmentResult struct {
	Score, Max, Pct float64
	Band            string
	Mastery         []Mastery
	Weak            []string // objectives below 50%
}

func band(pct float64) string {
	switch {
	case pct >= 91:
		return "A1"
	case pct >= 81:
		return "A2"
	case pct >= 71:
		return "B1"
	case pct >= 61:
		return "B2"
	case pct >= 51:
		return "C1"
	case pct >= 41:
		return "C2"
	case pct >= 33:
		return "D"
	default:
		return "E"
	}
}

// Assess scores responses against a rubric and diagnoses per-objective mastery (weak = below 50%).
func Assess(rubric []RubricItem, responses []Response) AssessmentResult {
	awarded := map[string]float64{}
	for _, r := range responses {
		awarded[r.ItemID] = r.Awarded
	}
	type acc struct{ a, m float64 }
	byObj := map[string]*acc{}
	var score, max float64
	for _, it := range rubric {
		a := clamp(awarded[it.ID], 0, it.Marks)
		score += a
		max += it.Marks
		if byObj[it.Objective] == nil {
			byObj[it.Objective] = &acc{}
		}
		byObj[it.Objective].a += a
		byObj[it.Objective].m += it.Marks
	}
	var mastery []Mastery
	var weak []string
	objs := make([]string, 0, len(byObj))
	for o := range byObj {
		objs = append(objs, o)
	}
	sort.Strings(objs)
	for _, o := range objs {
		ac := byObj[o]
		pct := 0.0
		if ac.m > 0 {
			pct = ac.a / ac.m * 100
		}
		mastery = append(mastery, Mastery{Objective: o, Awarded: ac.a, Max: ac.m, Pct: round1(pct)})
		if pct < 50 {
			weak = append(weak, o)
		}
	}
	pct := 0.0
	if max > 0 {
		pct = score / max * 100
	}
	return AssessmentResult{Score: score, Max: max, Pct: round1(pct), Band: band(pct), Mastery: mastery, Weak: weak}
}

// ── Engine 3 · Personalisation (next-best objective) ────────────────────────

// NextStep is a recommended objective with a reason.
type NextStep struct {
	Objective string
	Reason    string
}

// NextBest recommends the not-yet-mastered candidate objectives (mastery below threshold), weakest first.
func NextBest(mastery map[string]float64, candidates []string, threshold float64) []NextStep {
	type cm struct {
		obj string
		pct float64
	}
	var pending []cm
	for _, c := range candidates {
		if mastery[c] < threshold {
			pending = append(pending, cm{c, mastery[c]})
		}
	}
	sort.Slice(pending, func(i, j int) bool {
		if pending[i].pct != pending[j].pct {
			return pending[i].pct < pending[j].pct
		}
		return pending[i].obj < pending[j].obj
	})
	out := make([]NextStep, 0, len(pending))
	for _, p := range pending {
		out = append(out, NextStep{Objective: p.obj, Reason: "below mastery threshold"})
	}
	return out
}

// ── Engine 4 · Policy (project a lever over a baseline) ─────────────────────

// Baseline is a population and its current coverage.
type Baseline struct {
	Population      int
	CurrentCoverage float64 // [0,1]
}

// Lever is a policy intervention.
type Lever struct {
	Name          string
	CoverageDelta float64 // additive change to coverage (can be negative)
	CostPerUnit   float64 // cost per newly-covered person
	EquityWeight  float64 // [0,1]: how much the gain favours the underserved
}

// Projection is the projected effect.
type Projection struct {
	NewCoverage  float64
	NewlyCovered int
	Cost         float64
	EquityScore  float64
}

// Project applies a lever to a baseline (coverage clamped to [0,1]).
func Project(b Baseline, l Lever) Projection {
	newCov := clamp(b.CurrentCoverage+l.CoverageDelta, 0, 1)
	delta := newCov - b.CurrentCoverage
	newlyCovered := int(math.Round(delta * float64(b.Population)))
	if newlyCovered < 0 {
		newlyCovered = 0
	}
	return Projection{
		NewCoverage:  round3(newCov),
		NewlyCovered: newlyCovered,
		Cost:         round1(float64(newlyCovered) * l.CostPerUnit),
		EquityScore:  round3(clamp(delta, 0, 1) * clamp(l.EquityWeight, 0, 1)),
	}
}

// ── Engine 5 · Analytics (z-score anomaly detection) ────────────────────────

// Anomaly is a series point beyond the z threshold.
type Anomaly struct {
	Index int
	Value float64
	Z     float64
}

// DefaultZ is the default anomaly z-threshold.
const DefaultZ = 2.0

// Anomalies flags series points whose |z-score| exceeds z (population stddev; empty if no variance).
func Anomalies(series []float64, z float64) []Anomaly {
	if len(series) < 2 {
		return nil
	}
	var sum float64
	for _, v := range series {
		sum += v
	}
	mean := sum / float64(len(series))
	var ss float64
	for _, v := range series {
		ss += (v - mean) * (v - mean)
	}
	std := math.Sqrt(ss / float64(len(series)))
	if std == 0 {
		return nil
	}
	var out []Anomaly
	for i, v := range series {
		zs := (v - mean) / std
		if math.Abs(zs) > z {
			out = append(out, Anomaly{Index: i, Value: v, Z: round3(zs)})
		}
	}
	return out
}

// ── Engine 6 · Conversational (grounded answer with citation) ───────────────

// Doc is a corpus document.
type Doc struct {
	ID   string
	Text string
}

// Answer is a grounded response; Grounded=false means no supporting document was found (the engine refuses
// to answer ungrounded, the anti-hallucination guarantee).
type Answer struct {
	Text      string
	Citations []string
	Grounded  bool
}

// Converse answers a query strictly from the corpus, citing the documents that overlap the query terms. If
// nothing overlaps, it refuses (Grounded=false) rather than inventing an answer.
func Converse(query string, corpus []Doc) Answer {
	terms := tokenize(query)
	if len(terms) == 0 {
		return Answer{Text: "No question provided.", Grounded: false}
	}
	type hit struct {
		id    string
		score int
		text  string
	}
	var hits []hit
	for _, d := range corpus {
		dt := tokenize(d.Text)
		score := overlap(terms, dt)
		if score > 0 {
			hits = append(hits, hit{d.ID, score, d.Text})
		}
	}
	if len(hits) == 0 {
		return Answer{Text: "I don't have grounded information to answer that.", Grounded: false}
	}
	sort.Slice(hits, func(i, j int) bool {
		if hits[i].score != hits[j].score {
			return hits[i].score > hits[j].score
		}
		return hits[i].id < hits[j].id
	})
	var cites []string
	var parts []string
	for _, h := range hits {
		cites = append(cites, h.id)
		parts = append(parts, h.text)
	}
	return Answer{Text: strings.Join(parts, " "), Citations: cites, Grounded: true}
}

// ── helpers ─────────────────────────────────────────────────────────────────

func tokenize(s string) map[string]bool {
	out := map[string]bool{}
	for _, w := range strings.FieldsFunc(strings.ToLower(s), func(r rune) bool {
		return !(r >= 'a' && r <= 'z') && !(r >= '0' && r <= '9')
	}) {
		if len(w) > 2 { // drop trivial stopword-ish tokens
			out[w] = true
		}
	}
	return out
}

func overlap(a, b map[string]bool) int {
	n := 0
	for k := range a {
		if b[k] {
			n++
		}
	}
	return n
}

func clamp(v, lo, hi float64) float64 {
	if v < lo {
		return lo
	}
	if v > hi {
		return hi
	}
	return v
}

func round1(v float64) float64 { return math.Round(v*10) / 10 }
func round3(v float64) float64 { return math.Round(v*1000) / 1000 }
