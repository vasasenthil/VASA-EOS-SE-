// Package volumes is the DAT-TN-001 §D volume + scale model: per-entity record counts (§D.1), annual
// transactional volume (§D.2), and storage-capacity planning (§D.3) for Year-1 of operation. These are the
// indicative steady-state figures that drive L3 data-fabric sizing and feed the 1-crore load gate. The model
// validates a proposed cluster against the required storage. Deterministic + stdlib-only.
package volumes

import "math"

// ── §D.1 · per-entity record counts ──

// EntityCounts holds the Year-1 per-entity cardinalities.
type EntityCounts struct {
	Students            int64
	TeachersTeaching    int64
	TeachersNonTeaching int64
	Parents             int64
	Schools             int64
	PreKGAnganwadi      int64
	Sections            int64
	Citizens            int64 // L12 addressable surface
}

// TamilNadu is the §D.1 reference count set (~1.27 Cr students etc.).
func TamilNadu() EntityCounts {
	return EntityCounts{
		Students: 12_700_000, TeachersTeaching: 450_000, TeachersNonTeaching: 150_000,
		Parents: 27_500_000, Schools: 69_000, PreKGAnganwadi: 10_000, Sections: 600_000, Citizens: 60_000_000,
	}
}

// ── §D.2 · annual transactional volume ──

// Range is an indicative low–high estimate.
type Range struct {
	Low, High int64
}

// TransactionVolume is one annual transactional stream (§D.2).
type TransactionVolume struct {
	Name   string
	Annual Range
}

const (
	billion  = 1_000_000_000
	trillion = 1_000_000_000_000
	lakh     = 100_000
	crore    = 10_000_000
)

// AnnualVolumes is the §D.2 Year-1 transactional estimate (working figures from the brief).
func AnnualVolumes() []TransactionVolume {
	return []TransactionVolume{
		{"attendance", Range{25 * billion, 34 * billion}}, // ~25B student-day + ~9B teacher-day
		{"assessment", Range{10 * billion, 20 * billion}},
		{"submission", Range{2 * billion, 5 * billion}},
		{"communication", Range{10 * billion, 20 * billion}},
		{"grievance", Range{1 * lakh, 10 * lakh}},
		{"scheme-delivery", Range{50 * crore, 100 * crore}}, // disbursement events
		{"ai-agent-interaction", Range{5 * billion, 50 * billion}},
		{"iot-event", Range{1 * trillion, 3 * trillion}},
		{"audit-log", Range{100 * billion, 500 * billion}},
	}
}

// ── §D.3 · storage-capacity planning ──

// StorageTier is a planned datastore tier (§D.3).
type StorageTier struct {
	Name           string
	Engine         string
	TB             Range // Year-1 storage estimate
	NodesPerRegion int   // planned node count
}

// StoragePlan is the §D.3 Year-1 storage plan.
func StoragePlan() []StorageTier {
	return []StorageTier{
		{"oltp", "Citus + CockroachDB", Range{50, 200}, 32},
		{"olap", "ClickHouse + Iceberg", Range{500, 2000}, 16},
		{"timeseries", "Cassandra", Range{200, 1000}, 16},
		{"object", "MinIO + Iceberg", Range{1000, 5000}, 12},
		{"vector", "Milvus", Range{5, 20}, 8},
		{"graph", "Neo4j", Range{1, 5}, 4},
	}
}

// RequiredNodes is the node count needed to hold a tier's high-end storage at a given per-node capacity.
func RequiredNodes(t StorageTier, perNodeTB float64) int {
	if perNodeTB <= 0 {
		return 0
	}
	return int(math.Ceil(float64(t.TB.High) / perNodeTB))
}

// TierValidation reports whether a tier's planned nodes can hold its high-end storage at perNodeTB.
type TierValidation struct {
	Tier     string
	Required int
	Planned  int
	OK       bool
}

// ValidateStorage checks each planned tier against the storage it must hold at the given per-node capacity.
func ValidateStorage(perNodeTB float64) []TierValidation {
	var out []TierValidation
	for _, t := range StoragePlan() {
		req := RequiredNodes(t, perNodeTB)
		out = append(out, TierValidation{Tier: t.Name, Required: req, Planned: t.NodesPerRegion, OK: t.NodesPerRegion >= req})
	}
	return out
}

// BackupMultiplier is the §D.3 backup/DR storage multiplier (2× encrypted, geo-replicated to Coimbatore).
const BackupMultiplier = 2

// TotalStorageTB sums the high-end tier storage and applies the backup/DR multiplier.
func TotalStorageTB() int64 {
	var sum int64
	for _, t := range StoragePlan() {
		sum += t.TB.High
	}
	return sum * BackupMultiplier
}
