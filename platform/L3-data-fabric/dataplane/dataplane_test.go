package dataplane

import "testing"

func TestClassify(t *testing.T) {
	cases := map[string]Class{
		"aadhaar":   Class1,
		"biometric": Class1,
		"financial": Class1,
		"health":    Class2,
		"caste":     Class2,
		"marks":     Class2,
		"public":    Class4,
		"aggregate": Class4,
		"name":      Class3, // default
		"":          Class3,
	}
	for cat, want := range cases {
		if got := Classify(cat); got != want {
			t.Errorf("Classify(%q) = %q, want %q", cat, got, want)
		}
	}
}

func TestRouteStoreSelection(t *testing.T) {
	cases := []struct {
		datatype string
		category string
		want     Store
	}{
		{"row", "name", CitusOLTP},
		{"event", "telemetry", CassandraTS},
		{"blob", "certificate", MinIOBlob},
		{"aggregate", "public", ClickHouseOLAP},
		{"graph", "relationship", Neo4jGraph},
		{"vector", "embedding", MilvusVector},
		{"row", "public", ClickHouseOLAP}, // class4 row routes to analytics tier
	}
	for _, c := range cases {
		p := Route(Record{Category: c.category, Datatype: c.datatype, Region: TNSDC})
		if p.Store != c.want {
			t.Errorf("Route(%s/%s).Store = %q, want %q", c.datatype, c.category, p.Store, c.want)
		}
	}
}

func TestResidencyDeniesClass1OutsideTN(t *testing.T) {
	p := Route(Record{Category: "aadhaar", Datatype: "row", Region: "AWS-Mumbai"})
	if p.Allowed {
		t.Fatal("Class-1 PII outside TN-SDC must be denied")
	}
	if p.Store != "" {
		t.Fatal("a denied placement must offer no store (fail-closed)")
	}
	if len(p.Reasons) == 0 || p.Reasons[0] != "DATA-RESIDENCY" {
		t.Fatalf("expected DATA-RESIDENCY, got %v", p.Reasons)
	}
}

func TestResidencyAllowsClass1InTNDR(t *testing.T) {
	p := Route(Record{Category: "aadhaar", Datatype: "row", Region: TNSDCDR})
	if !p.Allowed {
		t.Fatal("Class-1 PII in the TN DR region must be allowed (still sovereign)")
	}
}

func TestResidencyAllowsClass4Anywhere(t *testing.T) {
	p := Route(Record{Category: "public", Datatype: "aggregate", Region: "edge-pop-7"})
	if !p.Allowed {
		t.Fatal("Class-4 public aggregates may reside outside TN-SDC")
	}
}

func TestDefaultRegionIsTNSDC(t *testing.T) {
	p := Route(Record{Category: "health", Datatype: "row"})
	if p.Region != TNSDC || !p.Allowed {
		t.Fatalf("default region must be TN-SDC and allowed; got region=%q allowed=%v", p.Region, p.Allowed)
	}
}

func TestRetentionDue(t *testing.T) {
	if due, rule := RetentionDue(Record{DaysSincePurposeEnd: 30}); !due || rule != "RETENTION-ERASE" {
		t.Fatalf("expired non-statutory PII must be due for erasure; got due=%v rule=%q", due, rule)
	}
	if due, _ := RetentionDue(Record{DaysSincePurposeEnd: 30, StatutoryHold: true}); due {
		t.Fatal("a statutory hold must prevent erasure")
	}
	if due, _ := RetentionDue(Record{DaysSincePurposeEnd: 0}); due {
		t.Fatal("data still within its purpose window is not due for erasure")
	}
}
