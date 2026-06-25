package integration

import (
	"testing"

	"github.com/vasa-eos-se-tn/platform/iot"
)

func TestIngestTelemetryResidency(t *testing.T) {
	p := newPlatform(t)
	before := p.TelemetryStored()
	// in-region biometric → accepted + stored + audited.
	ok := p.IngestTelemetry(iot.Reading{DeviceID: "BIO-9", SchoolUDISE: "33010100101", Kind: iot.BiometricAttendance, Value: 1, Region: "TN-SDC"})
	if !ok.Accepted || ok.PIIClass != 1 {
		t.Fatalf("in-region biometric must be accepted as Class-1: %+v", ok)
	}
	// offshore biometric → quarantined at residency, not stored.
	off := p.IngestTelemetry(iot.Reading{DeviceID: "BIO-9", SchoolUDISE: "33010100101", Kind: iot.BiometricAttendance, Value: 1, Region: "AWS-Mumbai"})
	if off.Accepted || !off.Quarantined {
		t.Fatalf("offshore Class-1 biometric must be quarantined: %+v", off)
	}
	if p.TelemetryStored() != before+1 {
		t.Fatalf("only the accepted reading should be stored (before=%d now=%d)", before, p.TelemetryStored())
	}
}

func TestOTARollout(t *testing.T) {
	p := newPlatform(t)
	updated := p.OTARollout("biometric-attendance", "v2")
	if len(updated) == 0 {
		t.Fatal("OTA must update at least one online biometric device")
	}
	// the offline device keeps v1 → the spread shows a mix.
	if p.FirmwareSpread()["v1"] == 0 {
		t.Fatal("an offline device should still be on v1 after the roll-out")
	}
}

func TestEdgeConvergence(t *testing.T) {
	p := newPlatform(t)
	r := p.EdgeConvergenceDemo()
	// two offline counters (28 + 31) converge to 59 with no lost writes.
	if r.Converged != 59 || !r.Consistent {
		t.Fatalf("edge replicas must converge to 59 consistently: %+v", r)
	}
	// add-wins: the concurrently re-added pupil survives the offline removal.
	found := false
	for _, e := range r.Enrolled {
		if e == "APAAR-2" {
			found = true
		}
	}
	if !found {
		t.Fatalf("the add-wins re-enrolment must survive after sync: %v", r.Enrolled)
	}
}
