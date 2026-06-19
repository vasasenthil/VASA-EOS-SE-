package resilience

import (
	"context"
	"errors"
	"math/rand"
	"testing"
	"time"
)

// a controllable clock for breaker tests.
type fakeClock struct{ t time.Time }

func (c *fakeClock) now() time.Time          { return c.t }
func (c *fakeClock) advance(d time.Duration) { c.t = c.t.Add(d) }

func TestBreakerOpensAfterThreshold(t *testing.T) {
	b := NewBreaker(BreakerConfig{FailThreshold: 3, OpenTimeout: time.Minute})
	fail := func() error { return errors.New("upstream 503") }
	for i := 0; i < 2; i++ {
		if err := b.Do(fail); err == nil || errors.Is(err, ErrOpen) {
			t.Fatalf("call %d should pass through and fail, got %v", i, err)
		}
	}
	if b.State() != Closed {
		t.Fatal("breaker should still be closed below threshold")
	}
	// third consecutive failure trips it
	b.Do(fail)
	if b.State() != Open {
		t.Fatalf("breaker should be open after 3 failures, got %s", b.State())
	}
	// while open, calls are rejected without invoking fn
	called := false
	err := b.Do(func() error { called = true; return nil })
	if !errors.Is(err, ErrOpen) || called {
		t.Fatalf("open breaker must fail fast without calling fn; err=%v called=%v", err, called)
	}
}

func TestBreakerHalfOpenRecovers(t *testing.T) {
	clk := &fakeClock{t: time.Unix(0, 0)}
	b := NewBreaker(BreakerConfig{FailThreshold: 1, OpenTimeout: 10 * time.Second, SuccessThreshold: 2, HalfOpenMax: 1})
	b.now = clk.now

	b.Do(func() error { return errors.New("boom") }) // trips open
	if b.State() != Open {
		t.Fatal("should be open")
	}
	clk.advance(11 * time.Second) // open timeout elapses → half-open
	if b.State() != HalfOpen {
		t.Fatalf("should be half-open after timeout, got %s", b.State())
	}
	// two successful probes close it (SuccessThreshold=2)
	if err := b.Do(func() error { return nil }); err != nil {
		t.Fatalf("probe should be allowed: %v", err)
	}
	if b.State() != HalfOpen {
		t.Fatal("one success should not yet close (threshold 2)")
	}
	b.Do(func() error { return nil })
	if b.State() != Closed {
		t.Fatalf("two successes should close the breaker, got %s", b.State())
	}
}

func TestBreakerHalfOpenReopensOnFailure(t *testing.T) {
	clk := &fakeClock{t: time.Unix(0, 0)}
	b := NewBreaker(BreakerConfig{FailThreshold: 1, OpenTimeout: time.Second})
	b.now = clk.now
	b.Do(func() error { return errors.New("x") })
	clk.advance(2 * time.Second)
	_ = b.State() // → half-open
	b.Do(func() error { return errors.New("still broken") })
	if b.State() != Open {
		t.Fatalf("a failed probe must re-open the circuit, got %s", b.State())
	}
}

func TestRetrySucceedsAfterTransientFailures(t *testing.T) {
	attempts := 0
	var slept int
	err := Retry(context.Background(), RetryPolicy{MaxAttempts: 5, BaseDelay: time.Millisecond},
		func(time.Duration) { slept++ }, rand.New(rand.NewSource(1)),
		func() error {
			attempts++
			if attempts < 3 {
				return errors.New("temporary")
			}
			return nil
		})
	if err != nil {
		t.Fatalf("should eventually succeed: %v", err)
	}
	if attempts != 3 {
		t.Fatalf("expected 3 attempts, got %d", attempts)
	}
	if slept != 2 {
		t.Fatalf("expected 2 backoff sleeps, got %d", slept)
	}
}

func TestRetryStopsOnNonRetryable(t *testing.T) {
	validation := errors.New("400 bad request")
	attempts := 0
	err := Retry(context.Background(), RetryPolicy{
		MaxAttempts: 5, BaseDelay: time.Millisecond,
		Retryable: func(e error) bool { return !errors.Is(e, validation) },
	}, func(time.Duration) {}, nil, func() error {
		attempts++
		return validation
	})
	if !errors.Is(err, validation) {
		t.Fatalf("non-retryable error should be returned: %v", err)
	}
	if attempts != 1 {
		t.Fatalf("non-retryable error must not be retried; attempts=%d", attempts)
	}
}

func TestRetryHonoursContextCancellation(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	attempts := 0
	err := Retry(ctx, RetryPolicy{MaxAttempts: 5, BaseDelay: time.Millisecond},
		func(time.Duration) {}, nil, func() error { attempts++; return errors.New("x") })
	if err == nil {
		t.Fatal("a cancelled context must abort retry")
	}
	if attempts != 0 {
		t.Fatalf("no attempts should run under a cancelled context, got %d", attempts)
	}
}

func TestBackoffIsExponentialAndCapped(t *testing.T) {
	// with no jitter (nil rnd) the delay is base*2^attempt capped at max
	if d := backoff(time.Second, 10*time.Second, 0, nil); d != time.Second {
		t.Fatalf("attempt 0 = %v", d)
	}
	if d := backoff(time.Second, 10*time.Second, 2, nil); d != 4*time.Second {
		t.Fatalf("attempt 2 = %v", d)
	}
	if d := backoff(time.Second, 10*time.Second, 6, nil); d != 10*time.Second {
		t.Fatalf("attempt 6 should cap at 10s, got %v", d)
	}
}

func TestIdempotencyDedupsSideEffects(t *testing.T) {
	idem := NewIdempotency()
	calls := 0
	provision := func() (any, error) { calls++; return "apaar-001", nil }

	v1, cached1, _ := idem.Do("provision:student-42", provision)
	v2, cached2, _ := idem.Do("provision:student-42", provision)

	if calls != 1 {
		t.Fatalf("a replayed idempotent call must not re-invoke fn; calls=%d", calls)
	}
	if cached1 || !cached2 {
		t.Fatalf("first call not cached, second cached: got %v/%v", cached1, cached2)
	}
	if v1 != "apaar-001" || v2 != "apaar-001" {
		t.Fatalf("cached value mismatch: %v %v", v1, v2)
	}
}

func TestIdempotencyDoesNotCacheFailures(t *testing.T) {
	idem := NewIdempotency()
	calls := 0
	_, _, err := idem.Do("k", func() (any, error) { calls++; return nil, errors.New("upstream down") })
	if err == nil {
		t.Fatal("expected error")
	}
	// a failed call is not cached → it runs again next time
	idem.Do("k", func() (any, error) { calls++; return "ok", nil })
	if calls != 2 {
		t.Fatalf("a failed call must remain retryable; calls=%d", calls)
	}
}
