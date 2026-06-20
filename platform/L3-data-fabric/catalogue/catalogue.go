// Package catalogue is the DAT-TN-001 §F.3 data-lineage / catalogue surface: a single, queryable data
// dictionary that unifies the seed inventory (Section C), the loaded lineage (where each asset came from, its
// version + checksum + load time), the Section E PII classification, and the §F.1/§F.2 governance register
// (named steward + applicable data-quality SLAs). It is the honest "what data do we hold, where did it come
// from, who is accountable, and how clean must it be" answer for auditors and stewards. Pure + stdlib-only.
package catalogue

import (
	"sort"

	"github.com/vasa-eos-se-tn/platform/quality"
	"github.com/vasa-eos-se-tn/platform/seed"
)

// categoryDomain maps a Section A data category to the governance domain used to resolve its §F.1 steward and
// §F.2 SLAs. Knowledge + AI-operational assets are governed by the model-card coverage regime; governance +
// credential-ledger assets by the audit-integrity regime.
var categoryDomain = map[seed.Category]string{
	seed.MasterReference:  "master",
	seed.Identity:         "identity",
	seed.Knowledge:        "model_card",
	seed.AIOperational:    "model_card",
	seed.Governance:       "audit",
	seed.CredentialLedger: "audit",
}

// piiLabel is the Section E.1 sensitivity label for a PII class.
func piiLabel(c seed.PIIClass) string {
	switch c {
	case seed.Class1:
		return "Class-1 · highly sensitive (biometric/financial/health)"
	case seed.Class2:
		return "Class-2 · sensitive personal (name/guardian/DOB/category/disability)"
	case seed.Class3:
		return "Class-3 · operational personal (academic/entitlement/grievance)"
	case seed.Class4:
		return "Class-4 · non-personal (aggregated/suppressed/public reference)"
	default:
		return "unclassified"
	}
}

// Lineage is an asset's provenance once it has been loaded by the seed loader (empty until then).
type Lineage struct {
	Loaded    bool     `json:"loaded"`
	Records   int      `json:"records"`
	Version   string   `json:"version,omitempty"`
	Checksum  string   `json:"checksum,omitempty"`
	LoadedAt  string   `json:"loaded_at,omitempty"`
	AmendedBy []string `json:"amended_by,omitempty"`
}

// Asset is one catalogued data asset: a seed unit enriched with its classification, governance ownership, the
// SLAs it must meet, and its lineage edges.
type Asset struct {
	ID             string        `json:"id"`
	Phase          string        `json:"phase"`
	Category       string        `json:"category"`        // Section A category
	Domain         string        `json:"domain"`          // governance domain (steward/SLA lookup)
	PIIClass       int           `json:"pii_class"`       // Section E.1 classification
	PIISensitivity string        `json:"pii_sensitivity"` // human label
	Source         string        `json:"source"`          // contracted upstream
	Steward        string        `json:"steward"`         // §F.1 accountable steward
	Gated          string        `json:"gated,omitempty"` // BLOCKERS id when substrate-dependent
	Synthetic      bool          `json:"synthetic"`
	Upstream       []string      `json:"upstream,omitempty"`   // direct dependencies
	Downstream     []string      `json:"downstream,omitempty"` // direct dependents
	SLAs           []quality.SLA `json:"slas,omitempty"`       // §F.2 objectives that apply
	Lineage        Lineage       `json:"lineage"`
}

// Catalogue is the assembled §F.3 register, indexed for query.
type Catalogue struct {
	assets []Asset
	byID   map[string]*Asset
}

// slasFor returns the §F.2 SLAs registered against a governance domain.
func slasFor(domain string) []quality.SLA {
	var out []quality.SLA
	for _, s := range quality.SLAs {
		if s.Domain == domain {
			out = append(out, s)
		}
	}
	return out
}

// Build assembles the catalogue from the seed inventory and a lineage lookup (typically the loader's Lineage
// method). Stewardship resolves from the asset's own recorded steward, falling back to the §F.1 register when
// the seed left it generic. Downstream edges are derived by inverting the dependency graph.
func Build(items []seed.Item, lineage func(string) (seed.LoadedSeed, bool)) *Catalogue {
	c := &Catalogue{byID: map[string]*Asset{}}
	downstream := map[string][]string{}
	for _, it := range items {
		for _, dep := range it.Deps {
			downstream[dep] = append(downstream[dep], it.ID)
		}
	}
	for _, it := range items {
		domain := categoryDomain[it.Category]
		steward := it.Steward
		if steward == "" {
			if s, ok := quality.StewardFor(domain); ok {
				steward = s.Name
			}
		}
		a := Asset{
			ID: it.ID, Phase: it.Phase, Category: string(it.Category), Domain: domain,
			PIIClass: int(it.PII), PIISensitivity: piiLabel(it.PII),
			Source: it.Source, Steward: steward, Gated: it.Gated, Synthetic: it.Synthetic,
			Upstream: append([]string(nil), it.Deps...), Downstream: append([]string(nil), downstream[it.ID]...),
			SLAs: slasFor(domain),
		}
		sort.Strings(a.Downstream)
		if ls, ok := lineage(it.ID); ok {
			a.Lineage = Lineage{Loaded: true, Records: ls.Records, Version: ls.Version, Checksum: ls.Checksum, LoadedAt: ls.LoadedAt, AmendedBy: append([]string(nil), ls.AmendedBy...)}
		}
		c.assets = append(c.assets, a)
	}
	for i := range c.assets {
		c.byID[c.assets[i].ID] = &c.assets[i]
	}
	return c
}

// Assets returns the full catalogue (inventory order).
func (c *Catalogue) Assets() []Asset { return c.assets }

// Get returns a single asset by id.
func (c *Catalogue) Get(id string) (Asset, bool) {
	if a, ok := c.byID[id]; ok {
		return *a, true
	}
	return Asset{}, false
}

// ByCategory returns assets in a Section A category.
func (c *Catalogue) ByCategory(category string) []Asset {
	var out []Asset
	for _, a := range c.assets {
		if a.Category == category {
			out = append(out, a)
		}
	}
	return out
}

// ByPIIClass returns assets at a Section E PII class (e.g. 1 to find every highly-sensitive asset for an audit).
func (c *Catalogue) ByPIIClass(class int) []Asset {
	var out []Asset
	for _, a := range c.assets {
		if a.PIIClass == class {
			out = append(out, a)
		}
	}
	return out
}

// BySteward returns the assets a named steward is accountable for.
func (c *Catalogue) BySteward(steward string) []Asset {
	var out []Asset
	for _, a := range c.assets {
		if a.Steward == steward {
			out = append(out, a)
		}
	}
	return out
}

// Trace walks the lineage graph from an asset, returning the transitive upstream (everything it derives from)
// and downstream (everything that derives from it) — the §F.3 impact/provenance trace.
func (c *Catalogue) Trace(id string) (upstream, downstream []string) {
	if _, ok := c.byID[id]; !ok {
		return nil, nil
	}
	upstream = c.walk(id, func(a *Asset) []string { return a.Upstream })
	downstream = c.walk(id, func(a *Asset) []string { return a.Downstream })
	return upstream, downstream
}

// walk does a breadth-first transitive closure over an edge selector, excluding the start node, sorted.
func (c *Catalogue) walk(start string, edges func(*Asset) []string) []string {
	seen := map[string]bool{}
	queue := []string{start}
	for len(queue) > 0 {
		cur := queue[0]
		queue = queue[1:]
		a, ok := c.byID[cur]
		if !ok {
			continue
		}
		for _, n := range edges(a) {
			if !seen[n] {
				seen[n] = true
				queue = append(queue, n)
			}
		}
	}
	out := make([]string, 0, len(seen))
	for n := range seen {
		out = append(out, n)
	}
	sort.Strings(out)
	return out
}

// Summary is an aggregate roll-up of the catalogue for a governance dashboard.
type Summary struct {
	Assets      int            `json:"assets"`
	Loaded      int            `json:"loaded"`
	Records     int            `json:"records"`
	Gated       int            `json:"gated"`
	Synthetic   int            `json:"synthetic"`
	ByCategory  map[string]int `json:"by_category"`
	ByPIIClass  map[int]int    `json:"by_pii_class"`
	Stewards    int            `json:"distinct_stewards"`
	SLAsTracked int            `json:"slas_tracked"`
}

// Summary computes the aggregate roll-up across the catalogue.
func (c *Catalogue) Summary() Summary {
	s := Summary{ByCategory: map[string]int{}, ByPIIClass: map[int]int{}}
	stewards := map[string]bool{}
	slas := map[string]bool{}
	for _, a := range c.assets {
		s.Assets++
		s.ByCategory[a.Category]++
		s.ByPIIClass[a.PIIClass]++
		if a.Steward != "" {
			stewards[a.Steward] = true
		}
		if a.Gated != "" {
			s.Gated++
		}
		if a.Synthetic {
			s.Synthetic++
		}
		if a.Lineage.Loaded {
			s.Loaded++
			s.Records += a.Lineage.Records
		}
		for _, sla := range a.SLAs {
			slas[sla.Domain+"/"+sla.Metric] = true
		}
	}
	s.Stewards = len(stewards)
	s.SLAsTracked = len(slas)
	return s
}
