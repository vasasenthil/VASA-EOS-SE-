package ratelimit

import (
	"testing"
	"time"
)

type fakeClock struct{ t time.Time }

func (c *fakeClock) now() time.Time          { return c.t }
func (c *fakeClock) advance(d time.Duration) { c.t = c.t.Add(d) }

func newClockedBucket(capacity, refill float64, clk *fakeClock) *Bucket {
	return &Bucket{capacity: capacity, tokens: capacity, refill: refill, last: clk.t, now: clk.now}
}

func TestBucketBurstThenThrottle(t *testing.T) {
	clk := &fakeClock{t: time.Unix(0, 0)}
	b := newClockedBucket(5, 1, clk) // burst 5, 1 token/sec
	for i := 0; i < 5; i++ {
		if !b.Allow() {
			t.Fatalf("burst token %d should be allowed", i)
		}
	}
	if b.Allow() {
		t.Fatal("6th request must be throttled (bucket empty)")
	}
}

func TestBucketRefills(t *testing.T) {
	clk := &fakeClock{t: time.Unix(0, 0)}
	b := newClockedBucket(5, 2, clk) // 2 tokens/sec
	for i := 0; i < 5; i++ {
		b.Allow()
	}
	if b.Allow() {
		t.Fatal("should be empty")
	}
	clk.advance(2 * time.Second) // +4 tokens
	for i := 0; i < 4; i++ {
		if !b.Allow() {
			t.Fatalf("refilled token %d should be allowed", i)
		}
	}
	if b.Allow() {
		t.Fatal("only 4 tokens should have refilled")
	}
}

func TestBucketRefillCaps(t *testing.T) {
	clk := &fakeClock{t: time.Unix(0, 0)}
	b := newClockedBucket(5, 10, clk)
	clk.advance(time.Hour) // would overflow without a cap
	if got := b.Tokens(); got != 5 {
		t.Fatalf("tokens must cap at capacity 5, got %v", got)
	}
}

func TestLimiterIsPerKey(t *testing.T) {
	clk := &fakeClock{t: time.Unix(0, 0)}
	l, _ := NewLimiter(2, 1)
	l.now = clk.now
	// tenant A exhausts its bucket; tenant B is unaffected (fair-share)
	if !l.Allow("A") || !l.Allow("A") || l.Allow("A") {
		t.Fatal("tenant A should get 2 then be throttled")
	}
	if !l.Allow("B") || !l.Allow("B") {
		t.Fatal("tenant B must have its own independent allowance")
	}
}

func TestAdmissionShedsBeyondCap(t *testing.T) {
	a, _ := NewAdmission(3)
	for i := 0; i < 3; i++ {
		if !a.Acquire() {
			t.Fatalf("slot %d should be admitted", i)
		}
	}
	if a.Acquire() {
		t.Fatal("4th concurrent request must be shed")
	}
	if a.InFlight() != 3 || a.Shed() != 1 {
		t.Fatalf("inflight=%d shed=%d, want 3/1", a.InFlight(), a.Shed())
	}
	a.Release()
	if !a.Acquire() {
		t.Fatal("after a release a slot should be available again")
	}
}

func TestValidation(t *testing.T) {
	if _, err := NewBucket(0, 1); err == nil {
		t.Fatal("zero capacity must error")
	}
	if _, err := NewLimiter(1, 0); err == nil {
		t.Fatal("zero refill must error")
	}
	if _, err := NewAdmission(0); err == nil {
		t.Fatal("zero max must error")
	}
}
