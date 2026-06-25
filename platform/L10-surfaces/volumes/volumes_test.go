package volumes

import "testing"

func TestEntityCountsMatchBrief(t *testing.T) {
	c := TamilNadu()
	if c.Students != 12_700_000 {
		t.Fatalf("~1.27 Cr students expected, got %d", c.Students)
	}
	if c.TeachersTeaching != 450_000 || c.TeachersNonTeaching != 150_000 {
		t.Fatalf("teacher counts wrong: %+v", c)
	}
	if c.Schools != 69_000 || c.Citizens != 60_000_000 {
		t.Fatalf("schools/citizens wrong: %+v", c)
	}
}

func TestAnnualVolumesPresent(t *testing.T) {
	v := AnnualVolumes()
	if len(v) != 9 {
		t.Fatalf("expected 9 transactional streams, got %d", len(v))
	}
	byName := map[string]Range{}
	for _, tv := range v {
		byName[tv.Name] = tv.Annual
	}
	// attendance ~25B+ and IoT in the trillions, matching §D.2
	if byName["attendance"].Low < 25*billion {
		t.Fatalf("attendance should be ~25B+, got %d", byName["attendance"].Low)
	}
	if byName["iot-event"].Low < 1*trillion {
		t.Fatalf("IoT events should be in the trillions, got %d", byName["iot-event"].Low)
	}
	if byName["audit-log"].High != 500*billion {
		t.Fatalf("audit-log high should be 500B, got %d", byName["audit-log"].High)
	}
}

func TestStoragePlanAndNodeSizing(t *testing.T) {
	tiers := StoragePlan()
	if len(tiers) != 6 {
		t.Fatalf("expected 6 storage tiers, got %d", len(tiers))
	}
	// OLAP high-end is 2000 TB → at 100 TB/node needs 20 nodes
	var olap StorageTier
	for _, t2 := range tiers {
		if t2.Name == "olap" {
			olap = t2
		}
	}
	if RequiredNodes(olap, 100) != 20 {
		t.Fatalf("OLAP at 100TB/node should need 20 nodes, got %d", RequiredNodes(olap, 100))
	}
}

func TestValidateStorage(t *testing.T) {
	// at a generous 500 TB/node the planned node counts comfortably cover every tier
	for _, v := range ValidateStorage(500) {
		if !v.OK {
			t.Fatalf("tier %q should validate at 500TB/node: required=%d planned=%d", v.Tier, v.Required, v.Planned)
		}
	}
	// at a tiny 1 TB/node the big tiers cannot be covered by their planned nodes
	failed := false
	for _, v := range ValidateStorage(1) {
		if !v.OK {
			failed = true
		}
	}
	if !failed {
		t.Fatal("at 1TB/node some tiers must fail to validate")
	}
}

func TestTotalStorageWithBackup(t *testing.T) {
	// sum of high-ends = 200+2000+1000+5000+20+5 = 8225 TB; ×2 backup = 16450
	if got := TotalStorageTB(); got != 16450 {
		t.Fatalf("total storage with 2x backup should be 16450 TB, got %d", got)
	}
}
