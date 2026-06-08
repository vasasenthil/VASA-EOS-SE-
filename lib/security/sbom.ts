// VASA-EOS(SE) — Software Bill of Materials (SBOM) generator, CycloneDX 1.5 (supply
// chain assurance). Pure: takes the package manifest and emits a standards-compliant
// SBOM document an auditor / SCA tool can ingest. scripts/generate-sbom.mjs writes it
// to disk and /api/sbom serves it; both call buildSbom.

export interface PackageManifest {
  name?: string
  version?: string
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

export interface SbomComponent {
  type: "library"
  name: string
  version: string
  scope: "required" | "optional"
  purl: string
}

export interface CycloneDxBom {
  bomFormat: "CycloneDX"
  specVersion: "1.5"
  version: number
  metadata: {
    timestamp: string
    component: { type: "application"; name: string; version: string }
    tools: { name: string; vendor: string }[]
  }
  components: SbomComponent[]
}

/** Normalise a semver range to a concrete-ish version string for the purl. */
function cleanVersion(range: string): string {
  return range.replace(/^[\^~>=<\s]+/, "").trim() || range
}

/** Package URL (purl) for an npm component, scope-aware. */
export function npmPurl(name: string, version: string): string {
  // CycloneDX/purl keeps the @scope; encode the leading @ of scoped names.
  const encoded = name.startsWith("@") ? `%40${name.slice(1)}` : name
  return `pkg:npm/${encoded}@${cleanVersion(version)}`
}

/** Build a CycloneDX 1.5 SBOM from a package manifest. Pure + deterministic. */
export function buildSbom(
  pkg: PackageManifest,
  opts: { includeDev?: boolean; timestamp?: string } = {},
): CycloneDxBom {
  const comp = (deps: Record<string, string> | undefined, scope: SbomComponent["scope"]): SbomComponent[] =>
    Object.entries(deps ?? {})
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, range]) => ({ type: "library", name, version: cleanVersion(range), scope, purl: npmPurl(name, range) }))

  const components = [
    ...comp(pkg.dependencies, "required"),
    ...(opts.includeDev ? comp(pkg.devDependencies, "optional") : []),
  ]

  return {
    bomFormat: "CycloneDX",
    specVersion: "1.5",
    version: 1,
    metadata: {
      timestamp: opts.timestamp ?? new Date().toISOString(),
      component: { type: "application", name: pkg.name ?? "vasa-eos-se", version: pkg.version ?? "0.0.0" },
      tools: [{ name: "vasa-eos-sbom", vendor: "VASA Infotech Services" }],
    },
    components,
  }
}

export interface SbomSummary {
  components: number
  required: number
  optional: number
}

export function sbomSummary(bom: CycloneDxBom): SbomSummary {
  return {
    components: bom.components.length,
    required: bom.components.filter((c) => c.scope === "required").length,
    optional: bom.components.filter((c) => c.scope === "optional").length,
  }
}
