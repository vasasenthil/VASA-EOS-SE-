// Package knowledgegraph is the L7 curriculum knowledge graph (CC-SPEC-001 §16, §10.7).
//
// Concepts are nodes; directed prerequisite edges define what must be learned first. The graph computes
// transitive prerequisites, a topologically-ordered learning path, and a readiness check — the sequencing
// substrate the personalisation engine reasons over. This is a Go PORT of the reference graph; the
// production property graph is persisted in Neo4j behind the same interface (BLOCKERS B-013). Pure + stdlib.
package knowledgegraph

import (
	"errors"
	"fmt"
	"sort"
)

// Concept is one node in the curriculum graph.
type Concept struct {
	ID            string
	Name          string
	Subject       string
	Grade         int
	Prerequisites []string // concept ids that must precede this one
}

// Graph is an immutable curriculum graph.
type Graph struct {
	concepts map[string]Concept
}

// New builds a graph, validating that every prerequisite edge points to a known concept and that the graph
// is acyclic (a prerequisite cycle is unlearnable).
func New(concepts []Concept) (*Graph, error) {
	m := make(map[string]Concept, len(concepts))
	for _, c := range concepts {
		if c.ID == "" {
			return nil, errors.New("knowledgegraph: concept id required")
		}
		if _, dup := m[c.ID]; dup {
			return nil, fmt.Errorf("knowledgegraph: duplicate concept %q", c.ID)
		}
		m[c.ID] = c
	}
	for _, c := range concepts {
		for _, p := range c.Prerequisites {
			if _, ok := m[p]; !ok {
				return nil, fmt.Errorf("knowledgegraph: concept %q has unknown prerequisite %q", c.ID, p)
			}
		}
	}
	g := &Graph{concepts: m}
	if err := g.detectCycle(); err != nil {
		return nil, err
	}
	return g, nil
}

// Concept returns a concept by id.
func (g *Graph) Concept(id string) (Concept, bool) {
	c, ok := g.concepts[id]
	return c, ok
}

// Len reports the number of concepts.
func (g *Graph) Len() int { return len(g.concepts) }

// TransitivePrerequisites returns all prerequisites (transitive) of a concept, nearest-first via BFS.
func (g *Graph) TransitivePrerequisites(id string) ([]Concept, error) {
	if _, ok := g.concepts[id]; !ok {
		return nil, fmt.Errorf("knowledgegraph: unknown concept %q", id)
	}
	seen := map[string]bool{}
	var order []Concept
	queue := append([]string{}, g.concepts[id].Prerequisites...)
	for len(queue) > 0 {
		cur := queue[0]
		queue = queue[1:]
		if seen[cur] {
			continue
		}
		seen[cur] = true
		order = append(order, g.concepts[cur])
		queue = append(queue, g.concepts[cur].Prerequisites...)
	}
	return order, nil
}

// LearningPath returns a topologically-ordered path to master target (all prerequisites first, target last).
// Ties are broken by (grade, id) for determinism.
func (g *Graph) LearningPath(target string) ([]Concept, error) {
	if _, ok := g.concepts[target]; !ok {
		return nil, fmt.Errorf("knowledgegraph: unknown concept %q", target)
	}
	// gather the closure (target + all transitive prereqs)
	inClosure := map[string]bool{target: true}
	stack := []string{target}
	for len(stack) > 0 {
		cur := stack[len(stack)-1]
		stack = stack[:len(stack)-1]
		for _, p := range g.concepts[cur].Prerequisites {
			if !inClosure[p] {
				inClosure[p] = true
				stack = append(stack, p)
			}
		}
	}
	// Kahn's algorithm over the closure, deterministic tie-break.
	indeg := map[string]int{}
	for id := range inClosure {
		for _, p := range g.concepts[id].Prerequisites {
			if inClosure[p] {
				indeg[id]++
			}
		}
	}
	var ready []string
	for id := range inClosure {
		if indeg[id] == 0 {
			ready = append(ready, id)
		}
	}
	var path []Concept
	for len(ready) > 0 {
		sort.Slice(ready, func(i, j int) bool { return g.less(ready[i], ready[j]) })
		cur := ready[0]
		ready = ready[1:]
		path = append(path, g.concepts[cur])
		// decrement dependents
		for id := range inClosure {
			for _, p := range g.concepts[id].Prerequisites {
				if p == cur {
					indeg[id]--
					if indeg[id] == 0 {
						ready = append(ready, id)
					}
				}
			}
		}
	}
	if len(path) != len(inClosure) {
		return nil, errors.New("knowledgegraph: cycle detected in learning path")
	}
	return path, nil
}

func (g *Graph) less(a, b string) bool {
	ca, cb := g.concepts[a], g.concepts[b]
	if ca.Grade != cb.Grade {
		return ca.Grade < cb.Grade
	}
	return ca.ID < cb.ID
}

// Ready reports whether a learner who has mastered `mastered` may start `target`: every DIRECT prerequisite
// must be mastered. Returns the missing prerequisites when not ready.
func (g *Graph) Ready(mastered map[string]bool, target string) (bool, []string, error) {
	c, ok := g.concepts[target]
	if !ok {
		return false, nil, fmt.Errorf("knowledgegraph: unknown concept %q", target)
	}
	var missing []string
	for _, p := range c.Prerequisites {
		if !mastered[p] {
			missing = append(missing, p)
		}
	}
	sort.Strings(missing)
	return len(missing) == 0, missing, nil
}

// detectCycle returns an error if the prerequisite graph contains a cycle.
func (g *Graph) detectCycle() error {
	const (
		white = 0
		grey  = 1
		black = 2
	)
	color := map[string]int{}
	var visit func(id string) error
	visit = func(id string) error {
		color[id] = grey
		for _, p := range g.concepts[id].Prerequisites {
			switch color[p] {
			case grey:
				return fmt.Errorf("knowledgegraph: prerequisite cycle through %q", p)
			case white:
				if err := visit(p); err != nil {
					return err
				}
			}
		}
		color[id] = black
		return nil
	}
	for id := range g.concepts {
		if color[id] == white {
			if err := visit(id); err != nil {
				return err
			}
		}
	}
	return nil
}

// DefaultCurriculum is the seeded Math curriculum (ported from the reference graph).
func DefaultCurriculum() []Concept {
	return []Concept{
		{"count", "Counting", "Math", 1, nil},
		{"add", "Addition", "Math", 1, []string{"count"}},
		{"sub", "Subtraction", "Math", 2, []string{"count", "add"}},
		{"mul", "Multiplication", "Math", 3, []string{"add"}},
		{"div", "Division", "Math", 3, []string{"sub", "mul"}},
		{"place", "Place Value", "Math", 2, []string{"count"}},
		{"frac", "Fractions", "Math", 4, []string{"div", "place"}},
		{"dec", "Decimals", "Math", 5, []string{"frac", "place"}},
		{"ratio", "Ratio & Proportion", "Math", 6, []string{"frac"}},
		{"pct", "Percentages", "Math", 6, []string{"frac", "dec", "ratio"}},
	}
}
