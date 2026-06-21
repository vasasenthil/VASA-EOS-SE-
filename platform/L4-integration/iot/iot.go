// Package iot is the L4 IoT-mesh ingestion layer (Synthesis Brief: "IoT mesh — EMQX cluster; K3s edge;
// biometric attendance, environment, nutrition, infrastructure telemetry; OTA firmware pipeline"). It is the
// sovereign ingestion seam for device telemetry: each reading is classified (biometric attendance is Class-1
// personal data and must stay TN-resident), validated, and routed to the timeseries sink — and a device fleet
// tracks firmware for OTA roll-outs. The EMQX broker + K3s edge hardware are gated (B-010); this is the
// application logic that runs on them. Deterministic + stdlib-only.
package iot

import (
	"errors"
	"sort"
)

// Kind is a telemetry stream.
type Kind string

const (
	BiometricAttendance Kind = "biometric-attendance" // a child's biometric → Class-1 personal data
	Environment         Kind = "environment"          // temperature/air — non-personal
	Nutrition           Kind = "nutrition"            // meal weight/temperature — non-personal
	Infrastructure      Kind = "infrastructure"       // water/power/CCTV health — non-personal
)

// Reading is one device telemetry sample.
type Reading struct {
	DeviceID    string  `json:"device_id"`
	SchoolUDISE string  `json:"school_udise"`
	Kind        Kind    `json:"kind"`
	Value       float64 `json:"value"`
	Region      string  `json:"region"` // ingestion region (residency check for Class-1)
	TS          string  `json:"ts"`
}

// PIIClass returns the §E classification a reading touches: biometric attendance is Class-1; the rest are
// non-personal (Class-4).
func (r Reading) PIIClass() int {
	if r.Kind == BiometricAttendance {
		return 1
	}
	return 4
}

// Sink is the timeseries store seam (Cassandra in production, B-013; an in-memory sink in the reference build).
type Sink interface {
	Store(r Reading) error
}

// MemSink is an in-memory Sink for the reference build.
type MemSink struct{ Rows []Reading }

// Store appends a reading.
func (m *MemSink) Store(r Reading) error { m.Rows = append(m.Rows, r); return nil }

// Result is the outcome of ingesting one reading.
type Result struct {
	Accepted    bool   `json:"accepted"`
	Quarantined bool   `json:"quarantined"`
	Reason      string `json:"reason,omitempty"`
	PIIClass    int    `json:"pii_class"`
}

// Pipeline ingests readings: validate → classify → residency (Class-1 must be TN-sovereign) → store → audit.
type Pipeline struct {
	Sink      Sink
	Sovereign map[string]bool                    // TN-sovereign residency regions
	Audit     func(event, device, detail string) // L5 audit hook (optional)
}

// Ingest runs one reading through the gate. A malformed reading is rejected; Class-1 biometric telemetry
// outside a TN-sovereign region is quarantined (residency), never stored.
func (p *Pipeline) Ingest(r Reading) Result {
	res := Result{PIIClass: r.PIIClass()}
	if r.DeviceID == "" || r.SchoolUDISE == "" || r.Kind == "" {
		res.Quarantined, res.Reason = true, "malformed reading (device/school/kind required)"
		p.audit("iot.reject", r.DeviceID, res.Reason)
		return res
	}
	if res.PIIClass == 1 {
		region := r.Region
		if region == "" {
			region = "TN-SDC"
		}
		if p.Sovereign != nil && !p.Sovereign[region] {
			res.Quarantined, res.Reason = true, "Class-1 biometric telemetry outside a TN-sovereign region"
			p.audit("iot.residency-block", r.DeviceID, res.Reason)
			return res
		}
	}
	if p.Sink != nil {
		if err := p.Sink.Store(r); err != nil {
			res.Quarantined, res.Reason = true, "sink error: "+err.Error()
			return res
		}
	}
	res.Accepted = true
	p.audit("iot.ingest", r.DeviceID, string(r.Kind))
	return res
}

func (p *Pipeline) audit(event, device, detail string) {
	if p.Audit != nil {
		p.Audit(event, device, detail)
	}
}

// ── Device fleet + OTA firmware ──

// Device is a registered edge device.
type Device struct {
	ID       string `json:"id"`
	UDISE    string `json:"udise"`
	Kind     Kind   `json:"kind"`
	Firmware string `json:"firmware"`
	Online   bool   `json:"online"`
}

// Fleet is the device registry + OTA firmware roll-out engine.
type Fleet struct {
	devices map[string]*Device
}

// NewFleet builds an empty fleet.
func NewFleet() *Fleet { return &Fleet{devices: map[string]*Device{}} }

// Register adds (or updates) a device.
func (f *Fleet) Register(d Device) {
	cp := d
	f.devices[d.ID] = &cp
}

// Get returns a device.
func (f *Fleet) Get(id string) (Device, bool) {
	d, ok := f.devices[id]
	if !ok {
		return Device{}, false
	}
	return *d, true
}

// ErrUnknownDevice is returned when an OTA targets a missing device.
var ErrUnknownDevice = errors.New("iot: unknown device")

// RolloutOTA pushes a firmware version to every online device of a kind, returning the ids updated. Offline
// devices keep their version and pick it up on reconnect (the edge sync layer reconciles them).
func (f *Fleet) RolloutOTA(kind Kind, firmware string) []string {
	var updated []string
	for _, d := range f.devices {
		if d.Kind == kind && d.Online {
			d.Firmware = firmware
			updated = append(updated, d.ID)
		}
	}
	sort.Strings(updated)
	return updated
}

// FirmwareSpread returns the count of devices per firmware version (the OTA roll-out picture).
func (f *Fleet) FirmwareSpread() map[string]int {
	out := map[string]int{}
	for _, d := range f.devices {
		out[d.Firmware]++
	}
	return out
}
