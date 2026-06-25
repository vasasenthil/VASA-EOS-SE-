# catalogue — DAT-TN-001 §F.3 data-lineage / catalogue surface

A single, queryable **data dictionary** for the platform: it answers, honestly and for any auditor or
steward, *what data do we hold, where did it come from, who is accountable, and how clean must it be?*

It is built over the seed inventory (Section C) and enriched with:

- **Classification** — the Section E.1 PII class per asset, with a human sensitivity label.
- **Provenance / lineage** — once the seed loader has run, each asset carries its source, version, checksum,
  load timestamp and any amendments.
- **Governance** — the §F.1 named **steward** accountable for the asset and the §F.2 **data-quality SLAs**
  that apply to its domain (master completeness, identity duplicate-rate, audit integrity, model-card
  coverage, …).
- **Lineage edges** — direct `Upstream` (dependencies) + `Downstream` (dependents), and a transitive `Trace`
  for impact/provenance analysis across the dependency graph.

## API

```go
c := catalogue.Build(items, loader.Lineage) // items = seed.Inventory() + seed.SyntheticInventory()
c.Assets()                 // the full dictionary
c.Get(id)                  // one asset
c.ByCategory("A-master")   // Section A slice
c.ByPIIClass(1)            // every highly-sensitive asset (audit)
c.BySteward(name)          // a steward's accountable assets
c.Trace(id)                // transitive upstream + downstream
c.Summary()                // governance roll-up
```

## Surfaced

`integration.Platform` assembles the catalogue at boot over every known asset (production + synthetic dev
fixtures; synthetic shows as inventoried-but-not-loaded). `platformd` exposes it at `GET /catalogue`
(`?list=1`, `?asset=ID`, `?trace=ID`).

Pure + stdlib-only; deterministic. 4 module tests.
