package notary

import "testing"

func leaves(items ...string) []string {
	out := make([]string, len(items))
	for i, s := range items {
		out[i] = HashItem([]byte(s))
	}
	return out
}

func TestAnchorAndVerifyChain(t *testing.T) {
	l := New()
	if _, err := l.Anchor(leaves("audit-root-day1", "cred-A", "cred-B")); err != nil {
		t.Fatal(err)
	}
	if _, err := l.Anchor(leaves("audit-root-day2", "cred-C")); err != nil {
		t.Fatal(err)
	}
	if l.Len() != 2 {
		t.Fatalf("expected 2 blocks, got %d", l.Len())
	}
	if err := l.Verify(); err != nil {
		t.Fatalf("clean chain should verify: %v", err)
	}
}

func TestInclusionProof(t *testing.T) {
	l := New()
	items := leaves("a", "b", "c", "d", "e") // odd count exercises the duplicate-last path
	b, _ := l.Anchor(items)
	for _, leaf := range items {
		p, err := l.Prove(b.Index, leaf)
		if err != nil {
			t.Fatalf("prove %s: %v", leaf, err)
		}
		if !VerifyProof(p) {
			t.Fatalf("inclusion proof for %s should verify against the root", leaf)
		}
	}
}

func TestProofRejectsNonMember(t *testing.T) {
	l := New()
	b, _ := l.Anchor(leaves("a", "b", "c"))
	if _, err := l.Prove(b.Index, HashItem([]byte("not-anchored"))); err == nil {
		t.Fatal("proving a non-member leaf must error")
	}
}

func TestForgedProofFails(t *testing.T) {
	l := New()
	items := leaves("a", "b", "c", "d")
	b, _ := l.Anchor(items)
	p, _ := l.Prove(b.Index, items[0])
	p.Leaf = HashItem([]byte("forged")) // claim a different leaf with the same proof path
	if VerifyProof(p) {
		t.Fatal("a proof must not verify for a substituted leaf")
	}
}

func TestTamperDetectedByVerify(t *testing.T) {
	l := New()
	l.Anchor(leaves("a", "b"))
	l.Anchor(leaves("c", "d"))
	// tamper with an anchored leaf in block 0 without recomputing roots/hashes
	l.blocks[0].Leaves[0] = HashItem([]byte("tampered"))
	if err := l.Verify(); err == nil {
		t.Fatal("Verify must detect a tampered leaf")
	}
}

func TestChainLinkTamperDetected(t *testing.T) {
	l := New()
	l.Anchor(leaves("a"))
	l.Anchor(leaves("b"))
	l.blocks[1].PrevHash = "deadbeef" // break the link
	if err := l.Verify(); err == nil {
		t.Fatal("Verify must detect a broken chain link")
	}
}

func TestEmptyAnchorRejected(t *testing.T) {
	if _, err := New().Anchor(nil); err == nil {
		t.Fatal("anchoring nothing must error")
	}
}

func TestSingleLeafBlock(t *testing.T) {
	l := New()
	b, _ := l.Anchor(leaves("solo"))
	p, err := l.Prove(b.Index, HashItem([]byte("solo")))
	if err != nil {
		t.Fatal(err)
	}
	if !VerifyProof(p) {
		t.Fatal("single-leaf inclusion proof should verify")
	}
}
