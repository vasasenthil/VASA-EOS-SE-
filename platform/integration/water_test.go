package integration

import "testing"

// Unit tests for the Water Quality Testing gates (pure transitions).

func baseWater(ecoli float64) WaterTest {
	t := WaterTest{ID: "WTR-T", OrgUnit: "SCH-T", Source: "borewell", Status: WaterSampled}
	params := []WaterParam{
		{Name: "ph", Value: 7.2, SafeMin: 6.5, SafeMax: 8.5, Critical: true},
		{Name: "turbidity_ntu", Value: 1, SafeMin: 0, SafeMax: 5, Critical: true},
		{Name: "ecoli_cfu", Value: ecoli, SafeMin: 0, SafeMax: 0, Critical: true},
	}
	for _, pm := range params {
		out, err := applyRecordParam(t, pm, "now")
		if err != nil {
			panic(err)
		}
		t = out
	}
	return t
}

func TestWaterApprovalGate(t *testing.T) {
	// E.coli present → cannot approve potable.
	if _, err := applyApproveWater(baseWater(12), "now"); err == nil {
		t.Fatal("expected approval to be rejected while E.coli is out of range")
	}
	// All critical in range → approve succeeds.
	out, err := applyApproveWater(baseWater(0), "now")
	if err != nil || out.Status != WaterApproved {
		t.Fatalf("expected approval to succeed for a clean sample, status=%s err=%v", out.Status, err)
	}
}

func TestWaterFailGate(t *testing.T) {
	// No critical out of range → cannot mark failed.
	if _, err := applyFailWater(baseWater(0), "unsafe?", "now"); err == nil {
		t.Fatal("expected fail to be rejected when no critical parameter is out of range")
	}
	// A failing critical parameter → fail succeeds.
	out, err := applyFailWater(baseWater(8), "E.coli detected", "now")
	if err != nil || out.Status != WaterFailed {
		t.Fatalf("expected fail to succeed with E.coli out of range, status=%s err=%v", out.Status, err)
	}
}

func TestWaterApprovalNeedsReadings(t *testing.T) {
	empty := WaterTest{ID: "WTR-E", OrgUnit: "SCH-T", Source: "tap", Status: WaterSampled}
	if _, err := applyApproveWater(empty, "now"); err == nil {
		t.Fatal("expected approval without any recorded readings to be rejected")
	}
}
