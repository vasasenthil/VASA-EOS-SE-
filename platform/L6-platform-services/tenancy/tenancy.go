// Package tenancy is the CC-SPEC-001 seven-tier sovereign multi-tenancy hierarchy, made a first-class part of
// the Go mesh (Synthesis Brief: "Seven multi-tenancy tiers — T0 Sovereign … through T6 School"). It models
// constitutional federalism operationally: the State of Tamil Nadu holds T0 (ultimate authority + the
// off-switch), and authority descends strictly T0 → T1 Secretariat → T2 Directorate → T3 District → T4 Block →
// T5 Cluster → T6 School. Every node owns its subtree; the governance rule is downward — a subject governs
// itself and its descendants, nothing above or sideways. The tree is anchored to the REAL estate (7
// directorates, 38 districts, 385 blocks, 3,800 clusters, 69,000 schools). TN is the sole sovereign tenant
// today; the model anchors T0 so sibling states / a national tier can be added later without restructuring.
// Pure + deterministic; the heavy estate tree is built on demand.
package tenancy

import (
	"errors"
	"fmt"
	"sort"
	"strings"

	"github.com/vasa-eos-se-tn/platform/population"
	"github.com/vasa-eos-se-tn/platform/seed"
)

// Tier describes one of the seven multi-tenancy levels.
type Tier struct {
	Code  string `json:"code"`  // T0..T6
	Level int    `json:"level"` // 0..6 (0 = sovereign, 6 = school leaf)
	Name  string `json:"name"`
	Scale string `json:"scale"` // indicative TN cardinality at this tier
}

// Tiers returns the canonical seven-tier catalogue (T0 sovereign → T6 school).
func Tiers() []Tier {
	return []Tier{
		{"T0", 0, "Sovereign", "1 — State of Tamil Nadu (ultimate authority + off-switch)"},
		{"T1", 1, "Secretariat", "1 — School Education Secretariat"},
		{"T2", 2, "Directorate", "7 — DSE · DEE · DGE · DMS · DTERT · DPSE · DNFE"},
		{"T3", 3, "District", "38"},
		{"T4", 4, "Block", "385"},
		{"T5", 5, "Cluster", "~3,800"},
		{"T6", 6, "School", "~69,000 (UDISE+ leaf)"},
	}
}

// TierAt returns the tier definition for a level (0..6).
func TierAt(level int) (Tier, bool) {
	ts := Tiers()
	if level < 0 || level >= len(ts) {
		return Tier{}, false
	}
	return ts[level], true
}

// Node is one tenant in the hierarchy.
type Node struct {
	ID       string `json:"id"`
	Level    int    `json:"level"` // 0..6, matching its tier
	Name     string `json:"name"`
	ParentID string `json:"parent_id,omitempty"`
}

// Errors.
var (
	ErrNotFound = errors.New("tenancy: node not found")
	ErrExists   = errors.New("tenancy: node already exists")
	ErrNoParent = errors.New("tenancy: parent not found")
	ErrBadTier  = errors.New("tenancy: a node's tier must be exactly one below its parent (strict chain)")
	ErrRootTier = errors.New("tenancy: only a T0 node may have no parent")
	ErrBadLevel = errors.New("tenancy: level out of range 0..6")
)

// Hierarchy is the sovereign tenancy tree with downward-governance semantics.
type Hierarchy struct {
	nodes    map[string]*Node
	children map[string][]string
	rootID   string
}

// New builds an empty hierarchy.
func New() *Hierarchy {
	return &Hierarchy{nodes: map[string]*Node{}, children: map[string][]string{}}
}

// Add inserts a node, enforcing the strict-descending-chain invariant: a T0 node has no parent and is the
// unique root; every other node's level must be exactly one below an existing parent's level.
func (h *Hierarchy) Add(n Node) error {
	if n.Level < 0 || n.Level > 6 {
		return ErrBadLevel
	}
	if _, dup := h.nodes[n.ID]; dup {
		return ErrExists
	}
	if n.ParentID == "" {
		if n.Level != 0 {
			return ErrRootTier
		}
		if h.rootID != "" {
			return ErrExists // a second root
		}
		h.rootID = n.ID
	} else {
		p, ok := h.nodes[n.ParentID]
		if !ok {
			return ErrNoParent
		}
		if n.Level != p.Level+1 {
			return ErrBadTier
		}
	}
	cp := n
	h.nodes[n.ID] = &cp
	if n.ParentID != "" {
		h.children[n.ParentID] = append(h.children[n.ParentID], n.ID)
	}
	return nil
}

// Root returns the T0 sovereign node.
func (h *Hierarchy) Root() (Node, bool) {
	if h.rootID == "" {
		return Node{}, false
	}
	return *h.nodes[h.rootID], true
}

// Get returns a node by id.
func (h *Hierarchy) Get(id string) (Node, bool) {
	n, ok := h.nodes[id]
	if !ok {
		return Node{}, false
	}
	return *n, true
}

// Len returns the number of nodes in the hierarchy.
func (h *Hierarchy) Len() int { return len(h.nodes) }

// Children returns the direct children ids of a node (sorted).
func (h *Hierarchy) Children(id string) []string {
	out := append([]string(nil), h.children[id]...)
	sort.Strings(out)
	return out
}

// Ancestors returns the governance chain from the root down to (and including) the node.
func (h *Hierarchy) Ancestors(id string) []Node {
	n, ok := h.nodes[id]
	if !ok {
		return nil
	}
	var chain []Node
	cur := n
	for cur != nil {
		chain = append([]Node{*cur}, chain...)
		if cur.ParentID == "" {
			break
		}
		cur = h.nodes[cur.ParentID]
	}
	return chain
}

// Path renders the ancestor chain as a readable governance path (root → … → node).
func (h *Hierarchy) Path(id string) string {
	chain := h.Ancestors(id)
	parts := make([]string, len(chain))
	for i, n := range chain {
		parts[i] = n.Name
	}
	return strings.Join(parts, " → ")
}

// Governs reports downward governance: a subject governs itself and every descendant — nothing above it and
// nothing in a sibling subtree. This is the fail-closed jurisdiction rule (mirrors lib/access/scope).
func (h *Hierarchy) Governs(subjectID, targetID string) bool {
	if subjectID == targetID {
		_, ok := h.nodes[subjectID]
		return ok
	}
	for _, a := range h.Ancestors(targetID) {
		if a.ID == subjectID {
			return true
		}
	}
	return false
}

// DescendantCount returns the size of a node's subtree, excluding the node itself.
func (h *Hierarchy) DescendantCount(id string) int {
	if _, ok := h.nodes[id]; !ok {
		return 0
	}
	n := 0
	stack := append([]string(nil), h.children[id]...)
	for len(stack) > 0 {
		cur := stack[len(stack)-1]
		stack = stack[:len(stack)-1]
		n++
		stack = append(stack, h.children[cur]...)
	}
	return n
}

// Descendants returns every descendant id of a node (transitive, sorted) — the subtree a node governs.
func (h *Hierarchy) Descendants(id string) []string {
	if _, ok := h.nodes[id]; !ok {
		return nil
	}
	var out []string
	stack := append([]string(nil), h.children[id]...)
	for len(stack) > 0 {
		cur := stack[len(stack)-1]
		stack = stack[:len(stack)-1]
		out = append(out, cur)
		stack = append(stack, h.children[cur]...)
	}
	sort.Strings(out)
	return out
}

// LeavesUnder returns the ids of the nodes at exactly the given level within a subject's subtree — e.g. the T6
// schools a T3 district governs. This is the downward-governance scope query for jurisdiction enforcement.
func (h *Hierarchy) LeavesUnder(id string, level int) []string {
	var out []string
	for _, d := range h.Descendants(id) {
		if n, ok := h.nodes[d]; ok && n.Level == level {
			out = append(out, d)
		}
	}
	return out
}

// TierCounts returns the number of nodes at each level 0..6.
func (h *Hierarchy) TierCounts() map[int]int {
	out := map[int]int{}
	for _, n := range h.nodes {
		out[n.Level]++
	}
	return out
}

// ── Build the TN hierarchy from the real estate ──

func sanitize(s string) string {
	return strings.ReplaceAll(strings.ReplaceAll(s, " ", "-"), ".", "")
}

// DistrictNodeID returns the canonical T3 tenancy node id for a district name (the same scheme BuildTN uses),
// so callers (e.g. the identity-plane bridge) can map a governance district to its tenancy node deterministically.
func DistrictNodeID(name string) string { return "TN-DIST-" + sanitize(name) }

// DirectorateNodeID returns the canonical T2 tenancy node id for a directorate code.
func DirectorateNodeID(code string) string { return "TN-DIR-" + code }

// directoryDistrictParent is the directorate that owns the territorial field hierarchy (districts → blocks →
// clusters → schools). DSE is the apex school-education directorate, so the 38 districts hang under it; the
// other six directorates are valid T2 nodes governing their own functional remits.
const directoryDistrictParent = "DSE"

// BuildTN constructs the full T0–T6 sovereign hierarchy anchored to the real estate: T0 TN → T1 Secretariat →
// T2 the 7 directorates → T3 the 38 districts (under DSE) → T4 blocks → T5 clusters → T6 schools, taken from
// the materialised population tree. It is deterministic and validates the strict chain as it builds.
func BuildTN(tree population.Tree) (*Hierarchy, error) {
	h := New()
	if err := h.Add(Node{ID: "TN", Level: 0, Name: "Tamil Nadu (Sovereign)"}); err != nil {
		return nil, err
	}
	if err := h.Add(Node{ID: "TN-SEC", Level: 1, Name: "School Education Secretariat", ParentID: "TN"}); err != nil {
		return nil, err
	}
	for _, d := range seed.Directorates {
		if err := h.Add(Node{ID: "TN-DIR-" + d.Code, Level: 2, Name: d.Name, ParentID: "TN-SEC"}); err != nil {
			return nil, err
		}
	}
	// districts (T3) under the DSE directorate.
	for _, district := range seed.Districts {
		id := "TN-DIST-" + sanitize(district)
		if err := h.Add(Node{ID: id, Level: 3, Name: district, ParentID: "TN-DIR-" + directoryDistrictParent}); err != nil {
			return nil, err
		}
	}
	// blocks (T4) under their district.
	for _, b := range tree.Blocks {
		if err := h.Add(Node{ID: b.ID, Level: 4, Name: b.Name, ParentID: "TN-DIST-" + sanitize(b.District)}); err != nil {
			return nil, fmt.Errorf("block %s: %w", b.ID, err)
		}
	}
	// clusters (T5) under their block.
	for _, c := range tree.Clusters {
		if err := h.Add(Node{ID: c.ID, Level: 5, Name: c.Name, ParentID: c.Block}); err != nil {
			return nil, fmt.Errorf("cluster %s: %w", c.ID, err)
		}
	}
	// schools (T6) under their cluster.
	for _, s := range tree.Schools {
		if err := h.Add(Node{ID: s.UDISE, Level: 6, Name: s.Name, ParentID: s.Cluster}); err != nil {
			return nil, fmt.Errorf("school %s: %w", s.UDISE, err)
		}
	}
	return h, nil
}
