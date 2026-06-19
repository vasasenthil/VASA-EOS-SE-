package tokens

import "testing"

func TestEquityBudgetCapsPerUser(t *testing.T) {
	m := New(100)
	// user A spends most of its budget
	m.CommitServed("A", "p1", "r1", 90)
	if rem := m.Remaining("A"); rem != 10 {
		t.Fatalf("A should have 10 left, got %d", rem)
	}
	// a request that exceeds A's remaining budget is not allowed (equity cap)
	p := m.Plan("A", "a very long fresh prompt that costs more than ten tokens to process please")
	if p.Allowed {
		t.Fatalf("A is over budget; the request must be refused: %+v", p)
	}
	// user B is unaffected — equity, not first-come-first-served
	if rem := m.Remaining("B"); rem != 100 {
		t.Fatalf("B should still have its full budget, got %d", rem)
	}
}

func TestExactPromptCacheIsFree(t *testing.T) {
	m := New(1000)
	m.CommitServed("A", "explain fractions", "Fractions are parts of a whole.", 20)
	used := 1000 - m.Remaining("A")
	p := m.Plan("A", "explain fractions") // exact repeat
	if !p.CacheHit || p.CacheKind != "exact" || p.Tier != Cached {
		t.Fatalf("an exact repeat should hit the cache for free: %+v", p)
	}
	if p.Cached != "Fractions are parts of a whole." {
		t.Fatalf("cached response wrong: %q", p.Cached)
	}
	// a cache plan does not change the budget
	if 1000-m.Remaining("A") != used {
		t.Fatal("a cache hit must not charge the budget")
	}
}

func TestSemanticCacheHitsNearDuplicate(t *testing.T) {
	m := New(1000)
	m.CommitServed("A", "Explain   Fractions", "ans", 20)
	p := m.Plan("A", "explain fractions") // different case/spacing → semantic hit
	if !p.CacheHit || p.CacheKind != "semantic" {
		t.Fatalf("a normalised near-duplicate should hit the semantic cache: %+v", p)
	}
}

func TestTierRouting(t *testing.T) {
	m := New(100)
	// fresh user with full budget → Premium
	if p := m.Plan("A", "short"); p.Tier != Premium {
		t.Fatalf("a full-budget user should route to Premium, got %s", p.Tier)
	}
	// drive A low (below 25%) → Standard
	m.CommitServed("A", "x", "y", 80)
	if p := m.Plan("A", "short"); p.Tier != Standard {
		t.Fatalf("a low-budget user should route to the cheaper Standard tier, got %s", p.Tier)
	}
}

func TestIndicCostsMore(t *testing.T) {
	ascii := Estimate("explain fractions to the class")
	tamil := Estimate("வகுப்பிற்கு பின்னங்களை விளக்குங்கள் இது")
	if tamil <= ascii {
		t.Fatalf("Indic text should estimate to at least as many tokens (more per char): ascii=%d tamil=%d", ascii, tamil)
	}
	if Estimate("") != 0 {
		t.Fatal("empty text costs 0 tokens")
	}
}

func TestStatsObservable(t *testing.T) {
	m := New(1000)
	m.CommitServed("A", "p", "r", 10)
	m.CommitCacheHit(10)
	m.CommitDenied()
	s := m.Stats()
	if s.Served != 1 || s.CacheHits != 1 || s.SavedTokens != 10 || s.Denied != 1 {
		t.Fatalf("stats wrong: %+v", s)
	}
}
