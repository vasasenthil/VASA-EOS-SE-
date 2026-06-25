package integration

import "github.com/vasa-eos-se-tn/platform/volumes"

// VolumeModel is the DAT-TN-001 §D volume + scale snapshot surfaced by the composition root: per-entity
// record counts (§D.1), annual transactional streams (§D.2), and the storage-capacity plan (§D.3) graded
// against an assumed per-node capacity. It lets readiness reflect the brief's real sizing numbers.
type VolumeModel struct {
	Entities       volumes.EntityCounts        `json:"entities"`
	Annual         []volumes.TransactionVolume `json:"annual_volumes"`
	Storage        []volumes.StorageTier       `json:"storage_plan"`
	Validation     []volumes.TierValidation    `json:"storage_validation"`
	PerNodeTB      int                         `json:"per_node_tb"`
	TotalStorageTB int64                       `json:"total_storage_tb"`
	StorageOK      bool                        `json:"storage_ok"`
}

// VolumeModel returns the §D model with the storage plan validated at the platform's assumed per-node capacity.
func (p *Platform) VolumeModel() VolumeModel {
	val := volumes.ValidateStorage(storagePerNodeTB)
	ok := true
	for _, v := range val {
		if !v.OK {
			ok = false
		}
	}
	return VolumeModel{
		Entities:       volumes.TamilNadu(),
		Annual:         volumes.AnnualVolumes(),
		Storage:        volumes.StoragePlan(),
		Validation:     val,
		PerNodeTB:      storagePerNodeTB,
		TotalStorageTB: volumes.TotalStorageTB(),
		StorageOK:      ok,
	}
}
