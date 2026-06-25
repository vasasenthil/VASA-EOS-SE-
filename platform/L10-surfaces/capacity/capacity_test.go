package capacity

import "testing"

func TestComputePeakLoad(t *testing.T) {
	p, err := Compute(TamilNaduLoad())
	if err != nil {
		t.Fatal(err)
	}
	// 1.27 Cr × 25% = 3,175,000 active at peak
	if p.PeakActiveUsers != 3_175_000 {
		t.Fatalf("peak active = %d, want 3,175,000", p.PeakActiveUsers)
	}
	// 3.175M × 0.5 rps = 1,587,500 rps peak; surge 2× = 3,175,000 rps
	if p.PeakRPS != 1_587_500 {
		t.Fatalf("peak rps = %v, want 1,587,500", p.PeakRPS)
	}
	if p.SurgeRPS != 3_175_000 {
		t.Fatalf("surge rps = %v, want 3,175,000", p.SurgeRPS)
	}
}

func TestSizeForTopology(t *testing.T) {
	topo := Topology{ShardRowCapacity: 1_000_000, NodeRPSCapacity: 20_000, ReplicationF: 3}
	p, err := SizeFor(TamilNaduLoad(), topo)
	if err != nil {
		t.Fatal(err)
	}
	// shards: ceil(12.7M × 1.3 / 1M) = ceil(16.51M / 1M) = 17
	if p.RequiredShards != 17 {
		t.Fatalf("required shards = %d, want 17", p.RequiredShards)
	}
	// app nodes: ceil(3,175,000 × 1.3 / 20,000) = ceil(206.375) = 207
	if p.RequiredAppNodes != 207 {
		t.Fatalf("required app nodes = %d, want 207", p.RequiredAppNodes)
	}
	// db nodes: ceil(17 × 3 × 1.3) = ceil(66.3) = 67
	if p.RequiredDBNodes != 67 {
		t.Fatalf("required db nodes = %d, want 67", p.RequiredDBNodes)
	}
}

func TestValidateSufficientTopology(t *testing.T) {
	topo := Topology{ShardCount: 24, AppNodes: 240, DBNodes: 80, ShardRowCapacity: 1_000_000, NodeRPSCapacity: 20_000, ReplicationF: 3}
	res, err := Validate(TamilNaduLoad(), topo)
	if err != nil {
		t.Fatal(err)
	}
	if !res.OK {
		t.Fatalf("a generously-sized topology should validate; failures=%v", res.Failures)
	}
}

func TestValidateInsufficientTopology(t *testing.T) {
	topo := Topology{ShardCount: 4, AppNodes: 10, DBNodes: 6, ShardRowCapacity: 1_000_000, NodeRPSCapacity: 20_000, ReplicationF: 3}
	res, err := Validate(TamilNaduLoad(), topo)
	if err != nil {
		t.Fatal(err)
	}
	if res.OK {
		t.Fatal("an undersized topology must fail validation")
	}
	for _, want := range []string{"insufficient shards", "insufficient app nodes", "insufficient db nodes"} {
		if !contains(res.Failures, want) {
			t.Errorf("expected failure %q; got %v", want, res.Failures)
		}
	}
}

func TestHeadroomApplied(t *testing.T) {
	// a topology sized EXACTLY to peak (no headroom) must fail, proving headroom is enforced
	topo := Topology{ShardRowCapacity: 1_000_000, NodeRPSCapacity: 20_000, ReplicationF: 1}
	p, _ := SizeFor(Load{Students: 1_000_000, Schools: 100, PeakConcurrencyPct: 0.25, RPSPerActiveUser: 0.5, SurgeFactor: 1}, topo)
	// 1M students × 1.3 headroom / 1M = ceil(1.3) = 2 shards (not 1)
	if p.RequiredShards != 2 {
		t.Fatalf("headroom should push 1M rows to 2 shards, got %d", p.RequiredShards)
	}
}

func TestValidation(t *testing.T) {
	if _, err := Compute(Load{Students: 0}); err == nil {
		t.Fatal("zero students must error")
	}
	if _, err := Compute(Load{Students: 1, Schools: 1, PeakConcurrencyPct: 2, RPSPerActiveUser: 1}); err == nil {
		t.Fatal("concurrency > 1 must error")
	}
	if _, err := SizeFor(TamilNaduLoad(), Topology{}); err == nil {
		t.Fatal("zero per-unit capacities must error")
	}
}

func contains(xs []string, s string) bool {
	for _, x := range xs {
		if x == s {
			return true
		}
	}
	return false
}
