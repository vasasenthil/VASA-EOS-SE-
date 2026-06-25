package ndears

import "testing"

func TestTwentyNineBlocks(t *testing.T) {
	bs := Blocks()
	if len(bs) != 29 {
		t.Fatalf("NDEAR-S must have exactly 29 building blocks, got %d", len(bs))
	}
	ids := map[string]bool{}
	for _, b := range bs {
		if b.ID == "" || b.Name == "" || b.Category == "" || b.Evidence == "" {
			t.Fatalf("block incomplete: %+v", b)
		}
		if ids[b.ID] {
			t.Fatalf("duplicate block id %s", b.ID)
		}
		ids[b.ID] = true
		switch b.Status {
		case Conformant, Federated, Pending:
		default:
			t.Fatalf("block %s has an invalid status %q", b.ID, b.Status)
		}
	}
}

func TestConformanceSummary(t *testing.T) {
	s := Summarise()
	if s.Total != 29 {
		t.Fatalf("summary total must be 29, got %d", s.Total)
	}
	if s.Sovereign+s.Federated+s.Pending != 29 {
		t.Fatalf("every block must be classified: %+v", s)
	}
	// the sovereign Go analogues must be the majority of the stack.
	if s.Sovereign*2 < 29 {
		t.Fatalf("most NDEAR blocks should have a sovereign Go analogue, got %d", s.Sovereign)
	}
	if s.Headline == "" {
		t.Fatal("headline must be computed")
	}
}
