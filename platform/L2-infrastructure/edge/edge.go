// Package edge is the L2 edge-compute offline-first sync layer (Synthesis Brief: "Edge compute — K3s on
// Pi5/Jetson; quantised models; CRDT sync for offline-first"). A school on a flaky link must keep working
// offline and converge with the State once reconnected, with NO lost writes and NO coordinator. These are
// state-based CRDTs (conflict-free replicated data types): every merge is commutative, associative and
// idempotent, so replicas that apply the same set of operations in ANY order converge to the same state. The
// K3s/edge hardware is gated (B-010); this is the sovereign sync logic that runs on it. Pure + stdlib-only.
package edge

import "sort"

// ── LWW-Register: last-write-wins single value (e.g. a pupil's current class) ──

// LWWRegister is a last-write-wins register: on merge the value with the higher timestamp wins; ties break by
// the larger value so the merge is deterministic regardless of replica order.
type LWWRegister struct {
	Value string `json:"value"`
	TS    int64  `json:"ts"`
}

// Merge returns the converged register (commutative, associative, idempotent).
func (r LWWRegister) Merge(o LWWRegister) LWWRegister {
	switch {
	case o.TS > r.TS:
		return o
	case o.TS < r.TS:
		return r
	case o.Value > r.Value:
		return o
	default:
		return r
	}
}

// ── G-Counter: grow-only counter (e.g. cumulative attendance marked offline at a school) ──

// GCounter is a grow-only counter keyed by replica/node id; the value is the sum of per-node maxima.
type GCounter struct {
	counts map[string]int64
}

// NewGCounter builds an empty counter.
func NewGCounter() *GCounter { return &GCounter{counts: map[string]int64{}} }

// Inc adds n (n >= 0) to a node's local count.
func (g *GCounter) Inc(node string, n int64) {
	if n < 0 {
		return
	}
	g.counts[node] += n
}

// Value is the total across all nodes.
func (g *GCounter) Value() int64 {
	var sum int64
	for _, v := range g.counts {
		sum += v
	}
	return sum
}

// Merge folds another counter in, taking the per-node maximum (idempotent + order-independent).
func (g *GCounter) Merge(o *GCounter) {
	for node, v := range o.counts {
		if v > g.counts[node] {
			g.counts[node] = v
		}
	}
}

// Clone returns a deep copy.
func (g *GCounter) Clone() *GCounter {
	c := NewGCounter()
	for k, v := range g.counts {
		c.counts[k] = v
	}
	return c
}

// ── OR-Set: observed-remove set (e.g. the set of enrolled APAAR ids at an offline school) ──

// ORSet is an observed-remove set: each add carries a unique tag; a remove tombstones the tags it has observed.
// An element is present iff it has at least one add-tag not shadowed by a remove. Re-adds therefore win over
// concurrent removes (add-wins), which is the safe default for enrolment.
type ORSet struct {
	adds    map[string]map[string]bool // element → set of add-tags
	removes map[string]map[string]bool // element → set of tombstoned tags
}

// NewORSet builds an empty set.
func NewORSet() *ORSet {
	return &ORSet{adds: map[string]map[string]bool{}, removes: map[string]map[string]bool{}}
}

// Add records element with a unique tag (e.g. node+seq).
func (s *ORSet) Add(element, tag string) {
	if s.adds[element] == nil {
		s.adds[element] = map[string]bool{}
	}
	s.adds[element][tag] = true
}

// Remove tombstones every add-tag currently observed for the element.
func (s *ORSet) Remove(element string) {
	if s.removes[element] == nil {
		s.removes[element] = map[string]bool{}
	}
	for tag := range s.adds[element] {
		s.removes[element][tag] = true
	}
}

// Contains reports presence: at least one add-tag is not tombstoned.
func (s *ORSet) Contains(element string) bool {
	for tag := range s.adds[element] {
		if !s.removes[element][tag] {
			return true
		}
	}
	return false
}

// Elements returns the present elements, sorted.
func (s *ORSet) Elements() []string {
	var out []string
	for e := range s.adds {
		if s.Contains(e) {
			out = append(out, e)
		}
	}
	sort.Strings(out)
	return out
}

// Merge unions the add-tags and remove-tombstones of two replicas (commutative, associative, idempotent).
func (s *ORSet) Merge(o *ORSet) {
	for e, tags := range o.adds {
		if s.adds[e] == nil {
			s.adds[e] = map[string]bool{}
		}
		for t := range tags {
			s.adds[e][t] = true
		}
	}
	for e, tags := range o.removes {
		if s.removes[e] == nil {
			s.removes[e] = map[string]bool{}
		}
		for t := range tags {
			s.removes[e][t] = true
		}
	}
}
