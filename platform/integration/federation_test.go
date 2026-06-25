package integration

import (
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/vasa-eos-se-tn/platform/adapters"
	"github.com/vasa-eos-se-tn/platform/reconcile"
)

func TestReconcileFundsFlagsLeakage(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprint(w, `{"scheme_code":"NMMS","allocated_inr":1000000,"released_inr":1000000,"utilised_inr":1000000}`)
	}))
	defer srv.Close()
	p := newPlatform(t)
	client := adapters.NewPFMSClient(srv.URL, nil)
	local := &reconcile.FundLedger{Allocated: 1_000_000, Released: 1_015_000, Utilised: 1_000_000} // 1.5% gap
	rep, err := p.ReconcileFunds(context.Background(), client, "NMMS", local)
	if err != nil {
		t.Fatal(err)
	}
	if rep.Recommendation != reconcile.Flagged {
		t.Fatalf("a fund-flow leakage should be Flagged: %q (%s)", rep.Recommendation, rep.Rationale)
	}
	// the reconciliation was audited
	found := false
	for _, rec := range p.Audit.Records() {
		if rec.Action == "federation.reconcile" && rec.Actor == "federation:pfms" {
			found = true
		}
	}
	if !found {
		t.Fatal("the PFMS reconciliation must be audited")
	}
}

func TestReconcileSchoolCountsFlagsRollGap(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprint(w, `{"udise_code":"33010100101","students":1000,"teachers":40,"classrooms":30}`)
	}))
	defer srv.Close()
	p := newPlatform(t)
	client := adapters.NewUDISEClient(srv.URL, nil)
	roll := 1300 // 30% gap vs EMIS → ghost-enrolment signal
	rep, err := p.ReconcileSchoolCounts(context.Background(), client, "33010100101", &roll)
	if err != nil {
		t.Fatal(err)
	}
	if rep.Recommendation != reconcile.Flagged {
		t.Fatalf("a 30%% roll gap should be Flagged: %q", rep.Recommendation)
	}
}
