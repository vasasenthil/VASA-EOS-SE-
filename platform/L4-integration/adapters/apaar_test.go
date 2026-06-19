package adapters

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"sync/atomic"
	"testing"
	"time"

	"github.com/vasa-eos-se-tn/platform/reconcile"
	"github.com/vasa-eos-se-tn/platform/resilience"
)

const apaarJSON = `{"apaar_id":"A1","full_name":"Anbu Selvan","dob":"2014-05-01","gender":"M","social_category":"OBC","journey_status":"enrolled"}`

// newTestClient builds a client whose retry does not actually sleep (fast tests).
func newTestClient(baseURL string) *APAARClient {
	c := NewAPAARClient(baseURL, &http.Client{Timeout: 2 * time.Second})
	c.sleep = func(time.Duration) {}
	return c
}

func TestGetApaarTransformsDTO(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprint(w, apaarJSON)
	}))
	defer srv.Close()

	rec, err := newTestClient(srv.URL).GetApaar(context.Background(), "A1")
	if err != nil {
		t.Fatal(err)
	}
	// the ACL transform maps upstream field names onto the domain model
	if rec.Name != "Anbu Selvan" || rec.Category != "OBC" || rec.DateOfBirth != "2014-05-01" {
		t.Fatalf("DTO not transformed to domain correctly: %+v", rec)
	}
}

func TestRetryOnTransient5xx(t *testing.T) {
	var calls int32
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if atomic.AddInt32(&calls, 1) < 3 {
			http.Error(w, "upstream busy", http.StatusServiceUnavailable) // 503 twice
			return
		}
		fmt.Fprint(w, apaarJSON) // 3rd succeeds
	}))
	defer srv.Close()

	rec, err := newTestClient(srv.URL).GetApaar(context.Background(), "A1")
	if err != nil {
		t.Fatalf("should succeed after transient 503s: %v", err)
	}
	if rec.ApaarID != "A1" {
		t.Fatal("wrong record")
	}
	if atomic.LoadInt32(&calls) != 3 {
		t.Fatalf("expected 3 upstream calls, got %d", calls)
	}
}

func TestNoRetryOn4xx(t *testing.T) {
	var calls int32
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		atomic.AddInt32(&calls, 1)
		http.Error(w, "no such learner", http.StatusNotFound) // 404 — non-retryable
	}))
	defer srv.Close()

	_, err := newTestClient(srv.URL).GetApaar(context.Background(), "missing")
	var he *HTTPError
	if !errors.As(err, &he) || he.Status != 404 {
		t.Fatalf("expected a 404 HTTPError, got %v", err)
	}
	if atomic.LoadInt32(&calls) != 1 {
		t.Fatalf("a 4xx must not be retried; calls=%d", calls)
	}
}

func TestBreakerOpensOnSustainedFailure(t *testing.T) {
	var calls int32
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		atomic.AddInt32(&calls, 1)
		http.Error(w, "down", http.StatusInternalServerError)
	}))
	defer srv.Close()

	c := newTestClient(srv.URL)
	// one GetApaar makes up to 3 attempts (all 500) → 3 breaker failures → breaker trips open
	_, _ = c.GetApaar(context.Background(), "A1")
	if c.Breaker().State() != resilience.Open {
		t.Fatalf("breaker should be open after sustained 5xx, got %s", c.Breaker().State())
	}
	before := atomic.LoadInt32(&calls)
	// next call must fail fast (ErrOpen) without hitting the upstream
	_, err := c.GetApaar(context.Background(), "A1")
	if !errors.Is(err, resilience.ErrOpen) {
		t.Fatalf("expected ErrOpen while breaker is open, got %v", err)
	}
	if atomic.LoadInt32(&calls) != before {
		t.Fatalf("open breaker must not call the upstream: before=%d after=%d", before, calls)
	}
}

func TestProvisionIsIdempotent(t *testing.T) {
	var calls int32
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		atomic.AddInt32(&calls, 1)
		fmt.Fprint(w, apaarJSON)
	}))
	defer srv.Close()

	c := newTestClient(srv.URL)
	ctx := context.Background()
	r1, cached1, err := c.ProvisionApaar(ctx, "enrol:student-42", map[string]any{"name": "Anbu Selvan"})
	if err != nil {
		t.Fatal(err)
	}
	r2, cached2, _ := c.ProvisionApaar(ctx, "enrol:student-42", map[string]any{"name": "Anbu Selvan"})
	if cached1 || !cached2 {
		t.Fatalf("replay should be served from the idempotency cache: %v/%v", cached1, cached2)
	}
	if r1.ApaarID != r2.ApaarID {
		t.Fatal("idempotent replay returned a different id (double-issue!)")
	}
	if atomic.LoadInt32(&calls) != 1 {
		t.Fatalf("an idempotent provision must hit the upstream once; calls=%d", calls)
	}
}

func TestReconcileFlagsNameDrift(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprint(w, apaarJSON) // upstream name "Anbu Selvan"
	}))
	defer srv.Close()

	local := reconcile.StudentRecord{ApaarID: "A1", Name: "Anbu", DOB: "2014-05-01", Status: "Enrolled"} // name differs
	report, err := newTestClient(srv.URL).Reconcile(context.Background(), "A1", local)
	if err != nil {
		t.Fatal(err)
	}
	if report.Recommendation != reconcile.Flagged {
		t.Fatalf("a name drift is identity-critical → Flagged, got %q (%s)", report.Recommendation, report.Rationale)
	}
}
