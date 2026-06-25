package integration

import (
	"time"

	"github.com/vasa-eos-se-tn/platform/capacity"
	"github.com/vasa-eos-se-tn/platform/dr"
	"github.com/vasa-eos-se-tn/platform/loadmodel"
	"github.com/vasa-eos-se-tn/platform/volumes"
)

// storagePerNodeTB is the assumed per-node usable storage when grading the DAT-TN-001 §D.3 plan: a 500 TB
// usable node (NVMe + tiered object) comfortably covers every planned tier at its high-end estimate.
const storagePerNodeTB = 500

// Readiness is a cross-layer go-live readiness snapshot merging L1 (off-switch), L10 (capacity + load model),
// operations (DR + SLO). It is the single question "is the platform fit to serve TN at scale right now?".
type Readiness struct {
	Disabled         bool          // L1 off-switch engaged
	PeakVUsTarget    int           // L10 load model — the crore-hour peak the topology must survive
	CapacityOK       bool          // L10 capacity — the proposed topology meets the requirement
	CapacityRequired capacity.Plan // the computed requirement
	CapacityFailures []string
	DRReady          bool      // operations — the DR drill met RPO + RTO
	DRReport         dr.Report // the drill grading
	SLOFrozen        bool      // operations — the error budget is spent (deploys frozen)
	StorageOK        bool      // L3 §D.3 — the planned storage tiers cover their Year-1 high-end estimate
	StorageFailures  []string  // tiers whose planned nodes cannot hold their estimate
	TotalStorageTB   int64     // §D.3 total planned storage incl. 2× backup/DR
	GoLiveReady      bool      // the conjunction: not disabled, capacity ok, DR ready, storage ok, budget not frozen
}

// Readiness grades the platform against a proposed topology and measured DR characteristics.
func (p *Platform) Readiness(topo capacity.Topology, replicationLag, promotionTime time.Duration) (Readiness, error) {
	var r Readiness
	r.Disabled = p.Switch.Engaged()
	r.PeakVUsTarget = loadmodel.CroreHour().PeakVUs()

	vr, err := capacity.Validate(capacity.TamilNaduLoad(), topo)
	if err != nil {
		return r, err
	}
	r.CapacityOK, r.CapacityRequired, r.CapacityFailures = vr.OK, vr.Required, vr.Failures

	rep, err := p.DR.Drill(true, replicationLag, promotionTime)
	if err != nil {
		return r, err
	}
	r.DRReport, r.DRReady = rep, rep.Healthy()

	h, err := p.Health()
	if err != nil {
		return r, err
	}
	r.SLOFrozen = h.SLO.DeployFrozen

	r.StorageOK = true
	for _, v := range volumes.ValidateStorage(storagePerNodeTB) {
		if !v.OK {
			r.StorageOK = false
			r.StorageFailures = append(r.StorageFailures, v.Tier)
		}
	}
	r.TotalStorageTB = volumes.TotalStorageTB()

	r.GoLiveReady = !r.Disabled && r.CapacityOK && r.DRReady && r.StorageOK && !r.SLOFrozen
	return r, nil
}
