package integration

import (
	"sync"

	"github.com/vasa-eos-se-tn/platform/edge"
	"github.com/vasa-eos-se-tn/platform/iot"
)

// The IoT mesh ingestion sink + edge device fleet are per-platform. The EMQX broker / K3s edge hardware are
// gated (B-010); this wires the sovereign ingestion + OTA logic that runs on them.
var (
	iotOnce  sync.Once
	iotSink  *iot.MemSink
	iotFleet *iot.Fleet
)

func iotState() (*iot.MemSink, *iot.Fleet) {
	iotOnce.Do(func() {
		iotSink = &iot.MemSink{}
		iotFleet = iot.NewFleet()
		// seed a small demo fleet anchored to the first two REAL estate schools.
		schools := tree().Schools
		a, b := "33010000001", "33010000002"
		if len(schools) >= 2 {
			a, b = schools[0].UDISE, schools[1].UDISE
		}
		iotFleet.Register(iot.Device{ID: "BIO-1", UDISE: a, Kind: iot.BiometricAttendance, Firmware: "v1", Online: true})
		iotFleet.Register(iot.Device{ID: "BIO-2", UDISE: b, Kind: iot.BiometricAttendance, Firmware: "v1", Online: false})
		iotFleet.Register(iot.Device{ID: "ENV-1", UDISE: a, Kind: iot.Environment, Firmware: "v1", Online: true})
	})
	return iotSink, iotFleet
}

// IngestTelemetry runs an IoT reading through the sovereign ingestion gate (classify → residency → store →
// audit). Biometric attendance is Class-1 and is quarantined if it arrives from outside a TN-sovereign region.
func (p *Platform) IngestTelemetry(r iot.Reading) iot.Result {
	sink, _ := iotState()
	pipe := &iot.Pipeline{
		Sink:      sink,
		Sovereign: map[string]bool{"TN-SDC": true, "TN-SDC-DR": true},
		Audit: func(event, device, detail string) {
			p.appendAudit("device:"+device, event, device, "telemetry", detail)
		},
	}
	return pipe.Ingest(r)
}

// TelemetryStored returns the number of readings persisted to the timeseries sink.
func (p *Platform) TelemetryStored() int {
	sink, _ := iotState()
	return len(sink.Rows)
}

// OTARollout pushes a firmware version to the online devices of a kind (offline devices reconcile on
// reconnect), returning the updated device ids; audited.
func (p *Platform) OTARollout(kind, firmware string) []string {
	_, fleet := iotState()
	updated := fleet.RolloutOTA(iot.Kind(kind), firmware)
	p.appendAudit("system", "iot.ota", kind, "rolled-out", firmware)
	return updated
}

// FirmwareSpread returns the device count per firmware version (the OTA roll-out picture).
func (p *Platform) FirmwareSpread() map[string]int {
	_, fleet := iotState()
	return fleet.FirmwareSpread()
}

// EdgeSyncResult demonstrates offline-first CRDT convergence: two school replicas mark attendance + edit the
// enrolled set offline, then sync — with no coordinator and no lost writes.
type EdgeSyncResult struct {
	AttendanceA int      `json:"attendance_replica_a"`
	AttendanceB int      `json:"attendance_replica_b"`
	Converged   int      `json:"converged_attendance"` // both replicas agree after sync
	Enrolled    []string `json:"enrolled_after_sync"`
	Consistent  bool     `json:"eventually_consistent"`
}

// EdgeConvergenceDemo runs a deterministic offline-first scenario and proves the two replicas converge.
func (p *Platform) EdgeConvergenceDemo() EdgeSyncResult {
	// two schools mark attendance offline on a shared grow-only counter.
	a := edge.NewGCounter()
	a.Inc("school-A", 28)
	b := edge.NewGCounter()
	b.Inc("school-B", 31)

	// enrolment edits offline on an OR-set (add-wins).
	setA := edge.NewORSet()
	setA.Add("APAAR-1", "a1")
	setA.Add("APAAR-2", "a2")
	setB := edge.NewORSet()
	setB.Merge(setA)
	setB.Remove("APAAR-2")
	setA.Add("APAAR-2", "a3") // concurrent re-add wins

	res := EdgeSyncResult{AttendanceA: int(a.Value()), AttendanceB: int(b.Value())}

	// sync both ways.
	ca, cb := a.Clone(), b.Clone()
	ca.Merge(b)
	cb.Merge(a)
	x, y := edge.NewORSet(), edge.NewORSet()
	x.Merge(setA)
	x.Merge(setB)
	y.Merge(setB)
	y.Merge(setA)

	res.Converged = int(ca.Value())
	res.Enrolled = x.Elements()
	res.Consistent = ca.Value() == cb.Value() && len(x.Elements()) == len(y.Elements())
	return res
}
