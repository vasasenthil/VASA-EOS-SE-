// Package ratelimit is the L10 surface-gateway rate limiter + admission control (CC-SPEC-001 §10.6, §10.8).
//
// At 1.27-crore scale, surviving a surge is as much about REFUSING work as doing it. Two mechanisms protect
// the platform: a per-key token-bucket rate limiter (fair-shares each tenant/user so one cannot starve
// others) and a global admission controller (a bounded in-flight semaphore that sheds load — returns "try
// later" — rather than collapsing when saturated). The clock is injectable so behaviour is tested
// deterministically (no real waiting). Stdlib-only; safe for concurrent use.
package ratelimit

import (
	"errors"
	"sync"
	"time"
)

// Bucket is a single token bucket: it refills at RefillPerSec up to Capacity (the burst size).
type Bucket struct {
	mu       sync.Mutex
	capacity float64
	tokens   float64
	refill   float64 // tokens per second
	last     time.Time
	now      func() time.Time
}

// NewBucket builds a full bucket with the given burst capacity and refill rate.
func NewBucket(capacity, refillPerSec float64) (*Bucket, error) {
	if capacity <= 0 || refillPerSec <= 0 {
		return nil, errors.New("ratelimit: capacity and refill must be positive")
	}
	return &Bucket{capacity: capacity, tokens: capacity, refill: refillPerSec, last: time.Now(), now: time.Now}, nil
}

func (b *Bucket) refillLocked() {
	t := b.now()
	if elapsed := t.Sub(b.last).Seconds(); elapsed > 0 {
		b.tokens += elapsed * b.refill
		if b.tokens > b.capacity {
			b.tokens = b.capacity
		}
		b.last = t
	}
}

// Allow takes one token if available.
func (b *Bucket) Allow() bool { return b.AllowN(1) }

// AllowN takes n tokens if at least n are available after refilling.
func (b *Bucket) AllowN(n float64) bool {
	b.mu.Lock()
	defer b.mu.Unlock()
	b.refillLocked()
	if b.tokens >= n {
		b.tokens -= n
		return true
	}
	return false
}

// Tokens returns the current token count (after refill) — for observability.
func (b *Bucket) Tokens() float64 {
	b.mu.Lock()
	defer b.mu.Unlock()
	b.refillLocked()
	return b.tokens
}

// Limiter is a per-key token-bucket rate limiter (fair-shares tenants/users).
type Limiter struct {
	mu       sync.Mutex
	buckets  map[string]*Bucket
	capacity float64
	refill   float64
	now      func() time.Time
}

// NewLimiter builds a limiter whose per-key buckets share the same capacity + refill.
func NewLimiter(capacity, refillPerSec float64) (*Limiter, error) {
	if capacity <= 0 || refillPerSec <= 0 {
		return nil, errors.New("ratelimit: capacity and refill must be positive")
	}
	return &Limiter{buckets: map[string]*Bucket{}, capacity: capacity, refill: refillPerSec, now: time.Now}, nil
}

// Allow rate-limits one request for a key, creating that key's bucket on first use.
func (l *Limiter) Allow(key string) bool {
	l.mu.Lock()
	b, ok := l.buckets[key]
	if !ok {
		b = &Bucket{capacity: l.capacity, tokens: l.capacity, refill: l.refill, last: l.now(), now: l.now}
		l.buckets[key] = b
	}
	l.mu.Unlock()
	return b.Allow()
}

// Admission is a global in-flight concurrency limiter that sheds load beyond Max.
type Admission struct {
	mu       sync.Mutex
	max      int
	inflight int
	shed     int // count of shed (rejected) requests, for observability
}

// NewAdmission builds an admission controller bounding concurrent in-flight work to max.
func NewAdmission(max int) (*Admission, error) {
	if max <= 0 {
		return nil, errors.New("ratelimit: max in-flight must be positive")
	}
	return &Admission{max: max}, nil
}

// Acquire admits a request if below the in-flight cap; otherwise it sheds (returns false).
func (a *Admission) Acquire() bool {
	a.mu.Lock()
	defer a.mu.Unlock()
	if a.inflight >= a.max {
		a.shed++
		return false
	}
	a.inflight++
	return true
}

// Release returns a slot after a request completes.
func (a *Admission) Release() {
	a.mu.Lock()
	defer a.mu.Unlock()
	if a.inflight > 0 {
		a.inflight--
	}
}

// InFlight returns the current in-flight count.
func (a *Admission) InFlight() int {
	a.mu.Lock()
	defer a.mu.Unlock()
	return a.inflight
}

// Shed returns the number of shed requests.
func (a *Admission) Shed() int {
	a.mu.Lock()
	defer a.mu.Unlock()
	return a.shed
}
