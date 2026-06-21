package iot

import "testing"

func TestIngestClassifiesAndEnforcesResidency(t *testing.T) {
	sink := &MemSink{}
	p := &Pipeline{Sink: sink, Sovereign: map[string]bool{"TN-SDC": true, "TN-SDC-DR": true}}

	// non-personal environment telemetry → accepted, Class-4.
	env := p.Ingest(Reading{DeviceID: "ENV-1", SchoolUDISE: "33010100101", Kind: Environment, Value: 31.5, Region: "TN-SDC"})
	if !env.Accepted || env.PIIClass != 4 {
		t.Fatalf("environment reading should be accepted as Class-4: %+v", env)
	}
	// biometric attendance is Class-1; in-region → accepted + stored.
	bio := p.Ingest(Reading{DeviceID: "BIO-1", SchoolUDISE: "33010100101", Kind: BiometricAttendance, Value: 1, Region: "TN-SDC"})
	if !bio.Accepted || bio.PIIClass != 1 {
		t.Fatalf("in-region biometric should be accepted as Class-1: %+v", bio)
	}
	// biometric attendance OFFSHORE → quarantined at residency, never stored.
	off := p.Ingest(Reading{DeviceID: "BIO-2", SchoolUDISE: "33010100101", Kind: BiometricAttendance, Value: 1, Region: "AWS-Mumbai"})
	if off.Accepted || !off.Quarantined {
		t.Fatalf("offshore Class-1 biometric must be quarantined: %+v", off)
	}
	// malformed reading → rejected.
	bad := p.Ingest(Reading{Kind: Environment})
	if bad.Accepted || !bad.Quarantined {
		t.Fatalf("malformed reading must be quarantined: %+v", bad)
	}
	// only the two accepted readings reached the sink.
	if len(sink.Rows) != 2 {
		t.Fatalf("sink should hold the 2 accepted readings, got %d", len(sink.Rows))
	}
}

func TestFleetOTARollout(t *testing.T) {
	f := NewFleet()
	f.Register(Device{ID: "BIO-1", UDISE: "33010100101", Kind: BiometricAttendance, Firmware: "v1", Online: true})
	f.Register(Device{ID: "BIO-2", UDISE: "33010100102", Kind: BiometricAttendance, Firmware: "v1", Online: false})
	f.Register(Device{ID: "ENV-1", UDISE: "33010100101", Kind: Environment, Firmware: "v1", Online: true})

	// roll out v2 to online biometric devices only.
	updated := f.RolloutOTA(BiometricAttendance, "v2")
	if len(updated) != 1 || updated[0] != "BIO-1" {
		t.Fatalf("OTA should update only the online biometric device, got %v", updated)
	}
	// the offline device keeps v1 (it reconciles on reconnect); the env device is untouched.
	if d, _ := f.Get("BIO-2"); d.Firmware != "v1" {
		t.Fatalf("offline device must keep v1, got %s", d.Firmware)
	}
	spread := f.FirmwareSpread()
	if spread["v2"] != 1 || spread["v1"] != 2 {
		t.Fatalf("firmware spread wrong: %+v", spread)
	}
}
