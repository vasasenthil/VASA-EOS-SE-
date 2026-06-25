// Package tokens is the L8 Token-Engineering economics layer (CC-SPEC-001 §10.7; the "Token Engineering —
// the Economics · what scales" discipline). It makes inference affordable AND equitable at 1.27-crore scale
// through three mechanisms:
//
//   - PER-USER EQUITY BUDGET — every user gets the SAME guaranteed token budget per window, so a heavy user
//     cannot starve others. Spend is capped per user (equity-bound), not first-come-first-served.
//   - PROMPT + SEMANTIC CACHE — an exact prompt repeat is served from cache for free (KV/prompt cache); a
//     near-duplicate (normalised) prompt is served from the semantic cache. Cache hits cost ~0 tokens.
//   - TIER ROUTING — a cache hit routes to the Cached tier; a user low on budget routes to the cheaper
//     Standard tier; otherwise Premium. Indic tokenisation costs more per character, reflected in Estimate.
//
// Deterministic + stdlib-only, safe for concurrent use. Observable via Stats.
package tokens

import (
	"strings"
	"sync"
)

// Tier is a compute/cost tier the request is routed to.
type Tier string

const (
	Cached   Tier = "cached"   // served from cache — ~free
	Standard Tier = "standard" // cheaper tier (user low on budget)
	Premium  Tier = "premium"  // full tier
)

// Estimate returns a rough token count for text. Indic (non-ASCII) scripts tokenise to more tokens per
// character, so non-ASCII-heavy text is weighted up — the "Indic tokenisation economics" nod.
func Estimate(text string) int {
	if text == "" {
		return 0
	}
	runes := []rune(text)
	nonASCII := 0
	for _, r := range runes {
		if r > 127 {
			nonASCII++
		}
	}
	base := (len(runes) + 3) / 4 // ~4 chars/token for ASCII
	// up to +50% when the text is entirely non-ASCII (Indic scripts fragment more).
	frac := float64(nonASCII) / float64(len(runes))
	weighted := float64(base) * (1 + 0.5*frac)
	n := int(weighted + 0.999)
	if n < 1 {
		n = 1
	}
	return n
}

// normalise collapses a prompt to a semantic-cache key (lowercase, single-spaced, trimmed).
func normalise(s string) string {
	return strings.Join(strings.Fields(strings.ToLower(s)), " ")
}

// Plan is how the meter proposes to serve a prompt (before charging).
type Plan struct {
	Tier      Tier
	CacheHit  bool
	CacheKind string // "exact" | "semantic" | ""
	Cached    string // the cached response when CacheHit
	EstTokens int    // estimated cost when not cached
	Allowed   bool   // false when the user's equity budget cannot cover the cost
	Remaining int    // the user's remaining budget
}

// Stats is observable meter state.
type Stats struct {
	Served      int
	CacheHits   int
	SavedTokens int
	Denied      int // requests refused because the equity budget was exhausted
}

// Meter implements the budget + cache + routing.
type Meter struct {
	perUser  int
	mu       sync.Mutex
	used     map[string]int
	exact    map[string]string
	semantic map[string]string
	stats    Stats
}

// New builds a meter granting each user perUserLimit tokens per window.
func New(perUserLimit int) *Meter {
	if perUserLimit <= 0 {
		perUserLimit = 10000
	}
	return &Meter{perUser: perUserLimit, used: map[string]int{}, exact: map[string]string{}, semantic: map[string]string{}}
}

// Remaining returns a user's remaining budget.
func (m *Meter) Remaining(user string) int {
	m.mu.Lock()
	defer m.mu.Unlock()
	return m.perUser - m.used[user]
}

// Plan proposes how to serve prompt for user, without charging. A cache hit is free; otherwise it estimates
// the cost, checks the user's equity budget, and routes to a tier.
func (m *Meter) Plan(user, prompt string) Plan {
	m.mu.Lock()
	defer m.mu.Unlock()
	remaining := m.perUser - m.used[user]

	if r, ok := m.exact[prompt]; ok {
		return Plan{Tier: Cached, CacheHit: true, CacheKind: "exact", Cached: r, Remaining: remaining, Allowed: true}
	}
	if r, ok := m.semantic[normalise(prompt)]; ok {
		return Plan{Tier: Cached, CacheHit: true, CacheKind: "semantic", Cached: r, Remaining: remaining, Allowed: true}
	}

	cost := Estimate(prompt)
	if cost > remaining {
		return Plan{Tier: Standard, EstTokens: cost, Allowed: false, Remaining: remaining}
	}
	tier := Premium
	if remaining < m.perUser/4 { // running low → cheaper tier
		tier = Standard
	}
	return Plan{Tier: tier, EstTokens: cost, Allowed: true, Remaining: remaining}
}

// CommitServed charges the user's budget for a freshly-served (non-cached) response and caches it.
func (m *Meter) CommitServed(user, prompt, response string, tokens int) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.used[user] += tokens
	m.exact[prompt] = response
	m.semantic[normalise(prompt)] = response
	m.stats.Served++
}

// CommitCacheHit records a cache hit (no charge) and the tokens it saved.
func (m *Meter) CommitCacheHit(savedTokens int) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.stats.CacheHits++
	m.stats.SavedTokens += savedTokens
}

// CommitDenied records an equity-budget refusal.
func (m *Meter) CommitDenied() {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.stats.Denied++
}

// Stats returns the observable meter state.
func (m *Meter) Stats() Stats {
	m.mu.Lock()
	defer m.mu.Unlock()
	return m.stats
}
