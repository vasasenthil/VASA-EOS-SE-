package integration

import "github.com/vasa-eos-se-tn/platform/seed"

// SeedStatus is a snapshot of the loaded DAT-TN-001 seed.
type SeedStatus struct {
	Version      string            `json:"version"`
	Loaded       int               `json:"loaded"`
	Skipped      int               `json:"skipped"`
	TotalRecords int               `json:"total_records"`
	OK           bool              `json:"ok"`
	Order        []string          `json:"order"`
	Rejected     map[string]string `json:"rejected,omitempty"`
}

// SeedStatus returns the seed-load status — the platform is "productive" only when OK is true.
func (p *Platform) SeedStatus() SeedStatus {
	return SeedStatus{
		Version:      p.seedManifest.Version,
		Loaded:       len(p.seedReport.Loaded),
		Skipped:      len(p.seedReport.Skipped),
		TotalRecords: p.Seed.TotalRecords(),
		OK:           p.seedReport.OK,
		Order:        p.seedReport.Order,
		Rejected:     p.seedReport.Rejected,
	}
}

// SeedManifestYAML returns the signed seed manifest (seed-manifest.yaml).
func (p *Platform) SeedManifestYAML() string { return p.seedManifest.ManifestYAML() }

// SeedLineage returns the lineage record for a loaded seed (where it came from, when, amendments).
func (p *Platform) SeedLineage(id string) (seed.LoadedSeed, bool) { return p.Seed.Lineage(id) }
