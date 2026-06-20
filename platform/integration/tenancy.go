package integration

import (
	"sync"

	"github.com/vasa-eos-se-tn/platform/tenancy"
)

// The T0–T6 sovereign tenancy hierarchy is materialised lazily over the real estate (≈73k nodes) on first
// access, behind a sync.Once — deterministic and cheap to query once built.
var (
	tenOnce sync.Once
	tenTree *tenancy.Hierarchy
	tenErr  error
)

func tenancyHierarchy() (*tenancy.Hierarchy, error) {
	tenOnce.Do(func() { tenTree, tenErr = tenancy.BuildTN(tree()) })
	return tenTree, tenErr
}

// TenancyTiers returns the canonical seven-tier (T0–T6) catalogue.
func (p *Platform) TenancyTiers() []tenancy.Tier { return tenancy.Tiers() }

// TenancySummary is the roll-up of the materialised sovereign hierarchy.
type TenancySummary struct {
	Tiers      []tenancy.Tier `json:"tiers"`
	Nodes      int            `json:"nodes"`
	TierCounts map[int]int    `json:"tier_counts"`
	Root       string         `json:"root"`
	Valid      bool           `json:"valid"` // the materialised tree hits the §D cardinalities exactly
}

// TenancySummary materialises (once) and validates the T0–T6 hierarchy over the real estate.
func (p *Platform) TenancySummary() TenancySummary {
	h, err := tenancyHierarchy()
	s := TenancySummary{Tiers: tenancy.Tiers()}
	if err != nil || h == nil {
		return s
	}
	root, _ := h.Root()
	counts := h.TierCounts()
	s.Nodes, s.TierCounts, s.Root = h.Len(), counts, root.ID
	s.Valid = counts[0] == 1 && counts[1] == 1 && counts[2] == 7 && counts[3] == 38 &&
		counts[4] == 385 && counts[5] == 3800 && counts[6] == 69000
	return s
}

// TenancyPath returns the governance path (T0 → … → node) for a tenant id, and whether it exists.
func (p *Platform) TenancyPath(id string) (string, bool) {
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return "", false
	}
	if _, ok := h.Get(id); !ok {
		return "", false
	}
	return h.Path(id), true
}

// Governs reports whether a subject tenant governs a target tenant under downward governance (fail-closed). It
// is the jurisdiction seam: a directorate governs its districts; a block never governs its district; T0 (TN)
// governs the whole estate.
func (p *Platform) Governs(subjectID, targetID string) bool {
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return false
	}
	return h.Governs(subjectID, targetID)
}

// TenantNode returns a single tenancy node with its tier.
func (p *Platform) TenantNode(id string) (tenancy.Node, bool) {
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return tenancy.Node{}, false
	}
	return h.Get(id)
}

// JurisdictionScope is the result of a downward-governance scope query: the schools a subject tenant governs.
type JurisdictionScope struct {
	Subject string   `json:"subject"`
	Exists  bool     `json:"exists"`
	Schools int      `json:"schools_governed"` // T6 leaves under the subject
	Sample  []string `json:"sample,omitempty"` // a few governed school UDISE codes
}

// SchoolsGovernedBy applies the fail-closed downward-governance rule to the real estate: it returns the count
// (and a sample) of T6 schools within the subject tenant's subtree. A district officer sees only their
// district's schools; the sovereign sees all 69,000; an unknown subject governs nothing. This is the
// jurisdiction-enforcement seam over live data (the ReBAC scope the platform applies to every listing).
func (p *Platform) SchoolsGovernedBy(subjectID string) JurisdictionScope {
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return JurisdictionScope{Subject: subjectID}
	}
	if _, ok := h.Get(subjectID); !ok {
		return JurisdictionScope{Subject: subjectID, Exists: false}
	}
	leaves := h.LeavesUnder(subjectID, 6)
	sample := leaves
	if len(sample) > 5 {
		sample = sample[:5]
	}
	return JurisdictionScope{Subject: subjectID, Exists: true, Schools: len(leaves), Sample: sample}
}
