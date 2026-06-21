package adapters

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

// serveJSON spins a one-shot test server returning the given JSON body.
func serveJSON(body string) *httptest.Server {
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(body))
	}))
}

func hc() *http.Client { return &http.Client{Timeout: 2 * time.Second} }

func TestHRMSAdapterTransforms(t *testing.T) {
	srv := serveJSON(`{"emp_id":"E-1","full_name":"R. Anbu","designation":"BT Assistant","posting_udise":"33010100101","cadre":"teaching"}`)
	defer srv.Close()
	c := NewHRMSClient(srv.URL, hc())
	c.sleep = func(time.Duration) {}
	rec, err := c.GetTeacher(context.Background(), "E-1")
	if err != nil {
		t.Fatal(err)
	}
	if rec.EmployeeID != "E-1" || rec.Name != "R. Anbu" || rec.SchoolUDISE != "33010100101" || !rec.Teaching {
		t.Fatalf("HRMS transform wrong: %+v", rec)
	}
}

func TestIFMSAdapterTransforms(t *testing.T) {
	srv := serveJSON(`{"scheme_code":"PUDHUMAI-PENN","head_of_account":"2202-01-101","sanctioned_amount":15000000}`)
	defer srv.Close()
	c := NewIFMSClient(srv.URL, hc())
	c.sleep = func(time.Duration) {}
	a, err := c.GetAllocation(context.Background(), "PUDHUMAI-PENN")
	if err != nil {
		t.Fatal(err)
	}
	if a.Scheme != "PUDHUMAI-PENN" || a.HeadOfAccount != "2202-01-101" || a.SanctionedINR != 15000000 {
		t.Fatalf("IFMS transform wrong: %+v", a)
	}
}

func TestMDMAdapterTransforms(t *testing.T) {
	srv := serveJSON(`{"udise":"33010100101","meals_served":12000,"days_served":60}`)
	defer srv.Close()
	c := NewMDMClient(srv.URL, hc())
	c.sleep = func(time.Duration) {}
	m, err := c.GetMeals(context.Background(), "33010100101")
	if err != nil {
		t.Fatal(err)
	}
	if m.SchoolUDISE != "33010100101" || m.MealsServed != 12000 || m.DaysServed != 60 {
		t.Fatalf("MDM transform wrong: %+v", m)
	}
}

func TestICDSAdapterTransforms(t *testing.T) {
	srv := serveJSON(`{"awc_code":"AWC-9","children_enrolled":40,"school_readiness_pct":82.5}`)
	defer srv.Close()
	c := NewICDSClient(srv.URL, hc())
	c.sleep = func(time.Duration) {}
	a, err := c.GetAnganwadi(context.Background(), "AWC-9")
	if err != nil {
		t.Fatal(err)
	}
	if a.Code != "AWC-9" || a.Children != 40 || a.SchoolReadyPct != 82.5 {
		t.Fatalf("ICDS transform wrong: %+v", a)
	}
}

func TestCBSEAdapterTransforms(t *testing.T) {
	srv := serveJSON(`{"affiliation_no":"1930123","school_name":"KV Chennai","status":"active"}`)
	defer srv.Close()
	c := NewCBSEClient(srv.URL, hc())
	c.sleep = func(time.Duration) {}
	a, err := c.GetAffiliation(context.Background(), "1930123")
	if err != nil {
		t.Fatal(err)
	}
	if a.AffiliationNo != "1930123" || a.SchoolName != "KV Chennai" || !a.Active {
		t.Fatalf("CBSE transform wrong: %+v", a)
	}
}

func TestTNBoardAdapterTransforms(t *testing.T) {
	srv := serveJSON(`{"register_no":"R-100","result":"PASS","total_marks":478}`)
	defer srv.Close()
	c := NewTNBoardClient(srv.URL, hc())
	c.sleep = func(time.Duration) {}
	r, err := c.GetResult(context.Background(), "R-100")
	if err != nil {
		t.Fatal(err)
	}
	if r.RegisterNo != "R-100" || !r.Passed || r.Marks != 478 {
		t.Fatalf("TNBoard transform wrong: %+v", r)
	}
}

func TestBSPAdapterTransforms(t *testing.T) {
	srv := serveJSON(`{"txn_id":"T-1","beneficiary_account":"xxxx1234","amount":1000,"settlement_status":"SETTLED"}`)
	defer srv.Close()
	c := NewBSPClient(srv.URL, hc())
	c.sleep = func(time.Duration) {}
	s, err := c.GetSettlement(context.Background(), "T-1")
	if err != nil {
		t.Fatal(err)
	}
	if s.TxnID != "T-1" || s.AmountINR != 1000 || !s.Settled {
		t.Fatalf("BSP transform wrong: %+v", s)
	}
}

func TestTelcoAdapterTransforms(t *testing.T) {
	srv := serveJSON(`{"message_id":"M-1","msisdn":"+9190000","dlr_state":"DELIVRD"}`)
	defer srv.Close()
	c := NewTelcoClient(srv.URL, hc())
	c.sleep = func(time.Duration) {}
	r, err := c.GetReceipt(context.Background(), "M-1")
	if err != nil {
		t.Fatal(err)
	}
	if r.MessageID != "M-1" || r.MSISDN != "+9190000" || !r.Delivered {
		t.Fatalf("Telco transform wrong: %+v", r)
	}
}
