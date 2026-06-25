package integration

import (
	"testing"
	"time"

	"github.com/vasa-eos-se-tn/platform/capacity"
)

func TestVolumeModelMatchesBrief(t *testing.T) {
	p := newPlatform(t)
	vm := p.VolumeModel()
	if vm.Entities.Students != 12_700_000 {
		t.Fatalf("§D.1 expects ~1.27 Cr students, got %d", vm.Entities.Students)
	}
	if len(vm.Annual) != 9 {
		t.Fatalf("§D.2 expects 9 transactional streams, got %d", len(vm.Annual))
	}
	if len(vm.Storage) != 6 || len(vm.Validation) != 6 {
		t.Fatalf("§D.3 expects 6 storage tiers, got plan=%d validation=%d", len(vm.Storage), len(vm.Validation))
	}
	if vm.PerNodeTB != storagePerNodeTB {
		t.Fatalf("per-node capacity should be %d, got %d", storagePerNodeTB, vm.PerNodeTB)
	}
	if vm.TotalStorageTB != 16450 {
		t.Fatalf("§D.3 total storage (incl. 2× backup) should be 16450 TB, got %d", vm.TotalStorageTB)
	}
	if !vm.StorageOK {
		t.Fatalf("the planned tiers must cover their Year-1 estimate at %d TB/node", storagePerNodeTB)
	}
}

func TestReadinessFoldsInStorage(t *testing.T) {
	p := newPlatform(t)
	topo := capacity.Topology{ShardCount: 24, AppNodes: 240, DBNodes: 80, ShardRowCapacity: 1_000_000, NodeRPSCapacity: 20_000, ReplicationF: 3}
	rep, err := p.Readiness(topo, 10*time.Second, 2*time.Minute)
	if err != nil {
		t.Fatal(err)
	}
	if !rep.StorageOK || len(rep.StorageFailures) != 0 {
		t.Fatalf("storage should validate in readiness: ok=%v failures=%v", rep.StorageOK, rep.StorageFailures)
	}
	if rep.TotalStorageTB != 16450 {
		t.Fatalf("readiness should report §D total storage 16450 TB, got %d", rep.TotalStorageTB)
	}
}
