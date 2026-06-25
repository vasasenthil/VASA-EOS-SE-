package integration

import (
	"context"
	"testing"

	"github.com/vasa-eos-se-tn/platform/quality"
)

func TestCheckQualityQuarantinesAndAlertsSteward(t *testing.T) {
	p := newPlatform(t)
	ds := quality.Dataset{Name: "schools", Rows: []map[string]any{
		{"udise": "1", "district": "Chennai"},
		{"udise": "1", "district": "Chennai"}, // duplicate
		{"udise": "", "district": "Salem"},    // incomplete
	}}
	qr := p.CheckQuality(context.Background(), "master", ds,
		quality.Completeness("udise", "district"), quality.Unique("udise"))
	if qr.Passed || len(qr.Quarantined) == 0 {
		t.Fatalf("the dirty dataset must fail and quarantine rows: %+v", qr)
	}
	if qr.SLAMet {
		t.Fatalf("below 99.9%% completeness must breach the master SLA: %.4f", qr.CompletenessPct)
	}
	if !qr.Alerted || qr.Steward == "" {
		t.Fatalf("a breach must alert the named steward: %+v", qr)
	}
	// the steward got an inbox alert
	if len(p.Notifications("steward:"+qr.Steward)) == 0 {
		t.Fatal("the steward should have received a data-quality alert")
	}
}

func TestCheckQualityCleanPasses(t *testing.T) {
	p := newPlatform(t)
	ds := quality.Dataset{Name: "ok", Rows: []map[string]any{
		{"udise": "1", "district": "Chennai"}, {"udise": "2", "district": "Madurai"},
	}}
	qr := p.CheckQuality(context.Background(), "master", ds, quality.Completeness("udise", "district"), quality.Unique("udise"))
	if !qr.Passed || !qr.SLAMet || qr.Alerted {
		t.Fatalf("a clean dataset should pass, meet the SLA, and raise no alert: %+v", qr)
	}
}
