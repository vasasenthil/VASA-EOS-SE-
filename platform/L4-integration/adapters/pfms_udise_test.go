package adapters

import (
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"sync/atomic"
	"testing"
	"time"

	"github.com/vasa-eos-se-tn/platform/reconcile"
)

func noSleepPFMS(url string) *PFMSClient {
	c := NewPFMSClient(url, &http.Client{Timeout: 2 * time.Second})
	c.sleep = func(time.Duration) {}
	return c
}
func noSleepUDISE(url string) *UDISEClient {
	c := NewUDISEClient(url, &http.Client{Timeout: 2 * time.Second})
	c.sleep = func(time.Duration) {}
	return c
}

func TestPFMSGetAndTransform(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprint(w, `{"scheme_code":"NMMS","allocated_inr":1000000,"released_inr":900000,"utilised_inr":850000}`)
	}))
	defer srv.Close()
	exp, err := noSleepPFMS(srv.URL).GetExpenditure(context.Background(), "NMMS")
	if err != nil {
		t.Fatal(err)
	}
	if exp.Allocated != 1_000_000 || exp.Released != 900_000 || exp.Utilised != 850_000 {
		t.Fatalf("PFMS DTO not transformed: %+v", exp)
	}
}

func TestPFMSReconcileFlagsLeakage(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprint(w, `{"scheme_code":"NMMS","allocated_inr":1000000,"released_inr":1000000,"utilised_inr":1000000}`)
	}))
	defer srv.Close()
	// local released differs by 1.5% → over the 1% money tolerance → Flagged
	local := &reconcile.FundLedger{Allocated: 1_000_000, Released: 1_015_000, Utilised: 1_000_000}
	rep, err := noSleepPFMS(srv.URL).Reconcile(context.Background(), "NMMS", local)
	if err != nil {
		t.Fatal(err)
	}
	if rep.Recommendation != reconcile.Flagged {
		t.Fatalf("a money drift beyond tolerance should be Flagged, got %q (%s)", rep.Recommendation, rep.Rationale)
	}
}

func TestPFMSRetriesTransient5xx(t *testing.T) {
	var calls int32
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if atomic.AddInt32(&calls, 1) < 3 {
			http.Error(w, "busy", http.StatusServiceUnavailable)
			return
		}
		fmt.Fprint(w, `{"scheme_code":"X","allocated_inr":1,"released_inr":1,"utilised_inr":1}`)
	}))
	defer srv.Close()
	if _, err := noSleepPFMS(srv.URL).GetExpenditure(context.Background(), "X"); err != nil {
		t.Fatalf("should succeed after transient 503s: %v", err)
	}
	if atomic.LoadInt32(&calls) != 3 {
		t.Fatalf("expected 3 calls, got %d", calls)
	}
}

func TestUDISEGetAndReconcile(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprint(w, `{"udise_code":"33010100101","students":1000,"teachers":40,"classrooms":30}`)
	}))
	defer srv.Close()
	c := noSleepUDISE(srv.URL)
	school, err := c.GetSchool(context.Background(), "33010100101")
	if err != nil {
		t.Fatal(err)
	}
	if school.Students != 1000 || school.Teachers != 40 {
		t.Fatalf("UDISE DTO not transformed: %+v", school)
	}
	// local roll 1010 → 1% delta, within tolerance → Reconciled
	roll := 1010
	rep, _ := c.Reconcile(context.Background(), "33010100101", &roll)
	if rep.Recommendation != reconcile.Reconciled {
		t.Fatalf("a 1%% roll delta is within tolerance → Reconciled, got %q (%s)", rep.Recommendation, rep.Rationale)
	}
}

func TestUDISEReconcileFlagsRollGap(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprint(w, `{"udise_code":"S","students":1000,"teachers":40,"classrooms":30}`)
	}))
	defer srv.Close()
	roll := 1300 // 30% gap vs EMIS → Flagged (ghost enrolment signal)
	rep, _ := noSleepUDISE(srv.URL).Reconcile(context.Background(), "S", &roll)
	if rep.Recommendation != reconcile.Flagged {
		t.Fatalf("a 30%% roll gap must be Flagged, got %q", rep.Recommendation)
	}
}
