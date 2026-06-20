package integration

import "github.com/vasa-eos-se-tn/platform/catalogue"

// CatalogueSummary returns the §F.3 data-catalogue roll-up (asset/record/steward/SLA counts).
func (p *Platform) CatalogueSummary() catalogue.Summary { return p.Catalogue.Summary() }

// CatalogueAssets returns every catalogued data asset with its classification, steward, SLAs and lineage.
func (p *Platform) CatalogueAssets() []catalogue.Asset { return p.Catalogue.Assets() }

// CatalogueAsset returns one catalogued asset by id.
func (p *Platform) CatalogueAsset(id string) (catalogue.Asset, bool) { return p.Catalogue.Get(id) }

// CatalogueTrace returns the transitive upstream/downstream lineage of an asset (§F.3 impact/provenance trace).
func (p *Platform) CatalogueTrace(id string) (upstream, downstream []string) {
	return p.Catalogue.Trace(id)
}
