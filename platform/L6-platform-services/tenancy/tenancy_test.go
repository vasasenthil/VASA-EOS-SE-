package tenancy

import (
	"testing"

	"github.com/vasa-eos-se-tn/platform/population"
)

func TestTierCatalogue(t *testing.T) {
	ts := Tiers()
	if len(ts) != 7 {
		t.Fatalf("expected 7 tiers T0–T6, got %d", len(ts))
	}
	if ts[0].Code != "T0" || ts[0].Name != "Sovereign" || ts[6].Code != "T6" || ts[6].Name != "School" {
		t.Fatalf("tier endpoints wrong: %+v / %+v", ts[0], ts[6])
	}
	for i, tr := range ts {
		if tr.Level != i {
			t.Fatalf("tier %s level should be %d, got %d", tr.Code, i, tr.Level)
		}
	}
}

func TestStrictChainInvariant(t *testing.T) {
	h := New()
	if err := h.Add(Node{ID: "TN", Level: 0, Name: "TN"}); err != nil {
		t.Fatal(err)
	}
	// a non-T0 node with no parent is rejected.
	if err := h.Add(Node{ID: "x", Level: 3, Name: "x"}); err != ErrRootTier {
		t.Fatalf("expected ErrRootTier, got %v", err)
	}
	// a node skipping a tier (T0 → T2) is rejected.
	if err := h.Add(Node{ID: "dir", Level: 2, Name: "dir", ParentID: "TN"}); err != ErrBadTier {
		t.Fatalf("expected ErrBadTier for a skipped tier, got %v", err)
	}
	// a strict child is accepted.
	if err := h.Add(Node{ID: "sec", Level: 1, Name: "sec", ParentID: "TN"}); err != nil {
		t.Fatalf("strict child should be accepted: %v", err)
	}
	// a second root is rejected.
	if err := h.Add(Node{ID: "TN2", Level: 0, Name: "TN2"}); err != ErrExists {
		t.Fatalf("a second root must be rejected, got %v", err)
	}
}

func TestDownwardGovernance(t *testing.T) {
	h := New()
	_ = h.Add(Node{ID: "TN", Level: 0, Name: "TN"})
	_ = h.Add(Node{ID: "SEC", Level: 1, Name: "Sec", ParentID: "TN"})
	_ = h.Add(Node{ID: "DSE", Level: 2, Name: "DSE", ParentID: "SEC"})
	_ = h.Add(Node{ID: "CHN", Level: 3, Name: "Chennai", ParentID: "DSE"})
	_ = h.Add(Node{ID: "CBE", Level: 3, Name: "Coimbatore", ParentID: "DSE"})
	_ = h.Add(Node{ID: "CHN-B1", Level: 4, Name: "Block", ParentID: "CHN"})

	// T0 governs everything (sovereign + off-switch authority).
	if !h.Governs("TN", "CHN-B1") {
		t.Fatal("the sovereign must govern every descendant")
	}
	// a node governs its own subtree…
	if !h.Governs("CHN", "CHN-B1") || !h.Governs("CHN", "CHN") {
		t.Fatal("a district must govern itself and its blocks")
	}
	// …but not siblings or ancestors (fail-closed).
	if h.Governs("CHN", "CBE") {
		t.Fatal("a district must NOT govern a sibling district")
	}
	if h.Governs("CHN-B1", "CHN") {
		t.Fatal("a block must NOT govern its parent district")
	}
	if h.Path("CHN-B1") != "TN → Sec → DSE → Chennai → Block" {
		t.Fatalf("governance path wrong: %q", h.Path("CHN-B1"))
	}
}

func TestBuildTNAnchoredToRealEstate(t *testing.T) {
	tree := population.BuildTree()
	h, err := BuildTN(tree)
	if err != nil {
		t.Fatalf("BuildTN must produce a valid strict hierarchy: %v", err)
	}
	counts := h.TierCounts()
	// T0=1, T1=1, T2=7, T3=38, T4=385, T5=3,800, T6=69,000.
	want := map[int]int{0: 1, 1: 1, 2: 7, 3: 38, 4: 385, 5: 3800, 6: 69000}
	for level, n := range want {
		if counts[level] != n {
			tr, _ := TierAt(level)
			t.Fatalf("tier %s should have %d nodes, got %d", tr.Code, n, counts[level])
		}
	}
	// the sovereign governs the entire estate.
	total := 1 + 1 + 7 + 38 + 385 + 3800 + 69000
	if h.Len() != total {
		t.Fatalf("hierarchy should have %d nodes, got %d", total, h.Len())
	}
	if h.DescendantCount("TN") != total-1 {
		t.Fatalf("the sovereign must govern all %d other nodes, got %d", total-1, h.DescendantCount("TN"))
	}
	// a real school leaf traces back to TN through all seven tiers.
	leaf := tree.Schools[0].UDISE
	path := h.Ancestors(leaf)
	if len(path) != 7 {
		t.Fatalf("a school leaf must have a 7-tier ancestry, got %d: %s", len(path), h.Path(leaf))
	}
	if path[0].ID != "TN" || path[6].ID != leaf {
		t.Fatalf("ancestry endpoints wrong: %+v … %+v", path[0], path[6])
	}
}

func TestGovernsUnknownNodes(t *testing.T) {
	h := New()
	_ = h.Add(Node{ID: "TN", Level: 0, Name: "TN"})
	if h.Governs("TN", "ghost") || h.Governs("ghost", "TN") {
		t.Fatal("unknown nodes must never be governed / govern (fail-closed)")
	}
}
