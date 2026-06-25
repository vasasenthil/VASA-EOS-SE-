package integration

import (
	"context"
	"crypto/ed25519"
	"testing"
)

func TestTutorPromptCacheServesFree(t *testing.T) {
	p := newPlatform(t)
	req := TutorRequest{Tenant: "TN/Chennai", UserID: "stu-1", Question: "Explain fractions for Class 4.", AgeAppropriate: true}

	first, err := p.AskTutor(context.Background(), req)
	if err != nil {
		t.Fatal(err)
	}
	if first.CacheHit || first.Tier != "premium" || first.TokensCharged == 0 {
		t.Fatalf("the first ask should be a fresh premium serve charged to the budget: %+v", first)
	}
	budgetAfterFirst := first.BudgetRemaining

	second, _ := p.AskTutor(context.Background(), req) // exact repeat
	if !second.CacheHit || second.Tier != "cached" || second.TokensCharged != 0 {
		t.Fatalf("the repeat ask should be served from cache for free: %+v", second)
	}
	if second.BudgetRemaining != budgetAfterFirst {
		t.Fatalf("a cache hit must not charge the budget: before=%d after=%d", budgetAfterFirst, second.BudgetRemaining)
	}
	if p.Tokens.Stats().SavedTokens == 0 {
		t.Fatal("the cache hit should have recorded saved tokens")
	}
}

func TestTutorEquityBudgetExhausted(t *testing.T) {
	_, priv, _ := ed25519.GenerateKey(nil)
	p, err := New(Config{Tenant: "TN/Chennai", IssuerKey: priv, TokenBudget: 5}, fakeDecider{}, fakeGate{})
	if err != nil {
		t.Fatal(err)
	}
	// a question that costs more than the tiny 5-token budget → fair refusal (not a starve)
	res, _ := p.AskTutor(context.Background(), TutorRequest{
		Tenant: "TN/Chennai", UserID: "stu-9",
		Question:       "Please explain in great detail the entire theory of fractions and decimals for Class 4.",
		AgeAppropriate: true,
	})
	if res.Stage != "budget-exhausted" || !containsStr(res.Reasons, "EQUITY-BUDGET") {
		t.Fatalf("an over-budget learner must be refused fairly: %+v", res)
	}
	if p.Tokens.Stats().Denied != 1 {
		t.Fatal("the equity refusal should be recorded in stats")
	}
}

func TestTutorTierDropsWhenBudgetLow(t *testing.T) {
	_, priv, _ := ed25519.GenerateKey(nil)
	p, _ := New(Config{Tenant: "TN/Chennai", IssuerKey: priv, TokenBudget: 40}, fakeDecider{}, fakeGate{})
	// a long first question (~32 tokens) leaves the learner below 25% of the 40-token budget
	long := "explain fractions decimals ratios percentages and place value in complete detail for class four students in tamil nadu today please"
	first, _ := p.AskTutor(context.Background(), TutorRequest{Tenant: "TN/Chennai", UserID: "u", Question: long, AgeAppropriate: true})
	if first.BudgetRemaining >= 10 {
		t.Fatalf("the long first question should leave the learner low on budget, remaining=%d", first.BudgetRemaining)
	}
	res, _ := p.AskTutor(context.Background(), TutorRequest{Tenant: "TN/Chennai", UserID: "u", Question: "explain decimals", AgeAppropriate: true})
	if res.Tier != "standard" {
		t.Fatalf("a low-budget learner should route to the cheaper Standard tier, got %q (remaining %d)", res.Tier, res.BudgetRemaining)
	}
}
