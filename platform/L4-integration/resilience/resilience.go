// Package resilience provides the reliability primitives every L4 federation adapter is built on
// (CC-SPEC-001 §10.6, §19). Sovereign-DPI upstreams (APAAR, UDISE+, PFMS, DIKSHA…) are out of the platform's
// control: they go slow, fail, and flap. An adapter must never let an upstream's failure cascade into the
// platform. These primitives compose into the anti-corruption layer:
//
//	Breaker      — a circuit breaker (closed → open → half-open) that sheds load off a failing upstream and
//	               probes for recovery, so callers fail fast instead of piling onto a dead dependency.
//	Retry        — bounded exponential backoff with jitter, honouring context cancellation and a
//	               retryable-error classifier (never retry a 4xx/validation error).
//	Idempotency  — dedup of side-effecting calls by key, so a provision/transfer replayed after a timeout
//	               does not double-issue.
//
// Clock and sleep are injectable so the behaviour is tested deterministically (no real waiting). Stdlib-only.
package resilience

import (
	"context"
	"errors"
	"math/rand"
	"sync"
	"time"
)

// ── Circuit breaker ─────────────────────────────────────────────────────────

// State is the breaker state.
type State int

const (
	Closed   State = iota // calls flow; failures are counted
	Open                  // calls are rejected immediately (fail fast) until the open timeout elapses
	HalfOpen              // a limited number of probe calls test whether the upstream recovered
)

func (s State) String() string {
	switch s {
	case Closed:
		return "closed"
	case Open:
		return "open"
	case HalfOpen:
		return "half-open"
	default:
		return "unknown"
	}
}

// ErrOpen is returned when the breaker rejects a call because the circuit is open.
var ErrOpen = errors.New("resilience: circuit open")

// BreakerConfig tunes a breaker.
type BreakerConfig struct {
	FailThreshold    int           // consecutive failures in Closed that trip the breaker Open
	OpenTimeout      time.Duration // how long to stay Open before allowing half-open probes
	HalfOpenMax      int           // max concurrent probe calls allowed in HalfOpen
	SuccessThreshold int           // consecutive probe successes in HalfOpen that close the breaker
}

// Breaker is a thread-safe circuit breaker.
type Breaker struct {
	mu         sync.Mutex
	cfg        BreakerConfig
	state      State
	consecFail int
	openedAt   time.Time
	halfOpenIn int // probes currently in flight
	halfOpenOK int // consecutive probe successes
	now        func() time.Time
}

// NewBreaker builds a breaker; zero-valued config fields get sane defaults.
func NewBreaker(cfg BreakerConfig) *Breaker {
	if cfg.FailThreshold <= 0 {
		cfg.FailThreshold = 5
	}
	if cfg.OpenTimeout <= 0 {
		cfg.OpenTimeout = 30 * time.Second
	}
	if cfg.HalfOpenMax <= 0 {
		cfg.HalfOpenMax = 1
	}
	if cfg.SuccessThreshold <= 0 {
		cfg.SuccessThreshold = 1
	}
	return &Breaker{cfg: cfg, state: Closed, now: time.Now}
}

// State returns the current breaker state (after applying any pending open→half-open timeout transition).
func (b *Breaker) State() State {
	b.mu.Lock()
	defer b.mu.Unlock()
	b.maybeHalfOpen()
	return b.state
}

// maybeHalfOpen transitions Open→HalfOpen once the open timeout has elapsed. Caller holds the lock.
func (b *Breaker) maybeHalfOpen() {
	if b.state == Open && b.now().Sub(b.openedAt) >= b.cfg.OpenTimeout {
		b.state = HalfOpen
		b.halfOpenIn = 0
		b.halfOpenOK = 0
	}
}

// Do runs fn through the breaker. It returns ErrOpen without calling fn when the circuit is open (or the
// half-open probe budget is exhausted), otherwise it runs fn and records the outcome.
func (b *Breaker) Do(fn func() error) error {
	if err := b.before(); err != nil {
		return err
	}
	err := fn()
	b.after(err == nil)
	return err
}

func (b *Breaker) before() error {
	b.mu.Lock()
	defer b.mu.Unlock()
	b.maybeHalfOpen()
	switch b.state {
	case Open:
		return ErrOpen
	case HalfOpen:
		if b.halfOpenIn >= b.cfg.HalfOpenMax {
			return ErrOpen
		}
		b.halfOpenIn++
	}
	return nil
}

func (b *Breaker) after(success bool) {
	b.mu.Lock()
	defer b.mu.Unlock()
	switch b.state {
	case Closed:
		if success {
			b.consecFail = 0
		} else if b.consecFail++; b.consecFail >= b.cfg.FailThreshold {
			b.trip()
		}
	case HalfOpen:
		b.halfOpenIn--
		if success {
			if b.halfOpenOK++; b.halfOpenOK >= b.cfg.SuccessThreshold {
				b.state = Closed
				b.consecFail = 0
				b.halfOpenOK = 0
			}
		} else {
			b.trip() // a single probe failure re-opens the circuit
		}
	}
}

func (b *Breaker) trip() {
	b.state = Open
	b.openedAt = b.now()
	b.consecFail = 0
	b.halfOpenOK = 0
	b.halfOpenIn = 0
}

// ── Retry with exponential backoff + jitter ─────────────────────────────────

// RetryPolicy bounds retries. Retryable classifies which errors are worth retrying (default: all non-nil).
type RetryPolicy struct {
	MaxAttempts int
	BaseDelay   time.Duration
	MaxDelay    time.Duration
	Retryable   func(error) bool
}

// Retry runs fn up to MaxAttempts times, backing off exponentially (BaseDelay, 2×, 4×…) capped at MaxDelay
// with full jitter, until it succeeds, hits a non-retryable error, exhausts attempts, or ctx is done.
// sleep and rnd are injected for deterministic tests; pass time.Sleep and a real *rand.Rand in production.
func Retry(ctx context.Context, p RetryPolicy, sleep func(time.Duration), rnd *rand.Rand, fn func() error) error {
	if p.MaxAttempts <= 0 {
		p.MaxAttempts = 3
	}
	if p.BaseDelay <= 0 {
		p.BaseDelay = 100 * time.Millisecond
	}
	if p.MaxDelay <= 0 {
		p.MaxDelay = 10 * time.Second
	}
	retryable := p.Retryable
	if retryable == nil {
		retryable = func(error) bool { return true }
	}
	var last error
	for attempt := 0; attempt < p.MaxAttempts; attempt++ {
		if err := ctx.Err(); err != nil {
			return err
		}
		last = fn()
		if last == nil {
			return nil
		}
		if !retryable(last) {
			return last
		}
		if attempt == p.MaxAttempts-1 {
			break
		}
		delay := backoff(p.BaseDelay, p.MaxDelay, attempt, rnd)
		sleep(delay)
	}
	return last
}

// backoff returns base*2^attempt capped at max, with full jitter in [0, capped].
func backoff(base, max time.Duration, attempt int, rnd *rand.Rand) time.Duration {
	d := base
	for i := 0; i < attempt; i++ {
		d *= 2
		if d >= max {
			d = max
			break
		}
	}
	if d > max {
		d = max
	}
	if rnd != nil && d > 0 {
		return time.Duration(rnd.Int63n(int64(d) + 1))
	}
	return d
}

// ── Idempotency ─────────────────────────────────────────────────────────────

type entry struct {
	val any
}

// Idempotency dedups side-effecting calls by key: the first success is cached and replays return it without
// re-invoking fn. Failures are not cached (so they remain retryable). Thread-safe.
type Idempotency struct {
	mu sync.Mutex
	m  map[string]entry
}

// NewIdempotency builds an empty store.
func NewIdempotency() *Idempotency { return &Idempotency{m: map[string]entry{}} }

// Do returns the cached result for key if present (cached=true). Otherwise it calls fn; on success it caches
// and returns the value (cached=false); on error it returns the error without caching.
func (i *Idempotency) Do(key string, fn func() (any, error)) (val any, cached bool, err error) {
	i.mu.Lock()
	if e, ok := i.m[key]; ok {
		i.mu.Unlock()
		return e.val, true, nil
	}
	i.mu.Unlock()

	v, err := fn()
	if err != nil {
		return nil, false, err
	}
	i.mu.Lock()
	i.m[key] = entry{val: v}
	i.mu.Unlock()
	return v, false, nil
}
