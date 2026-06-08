import { test } from "node:test"
import assert from "node:assert/strict"
import { buildSbom, sbomSummary, npmPurl } from "@/lib/security/sbom"

const pkg = {
  name: "vasa-eos-se",
  version: "1.0.0",
  dependencies: { next: "15.2.4", react: "^19.0.0", "@radix-ui/react-slot": "~1.1.0" },
  devDependencies: { typescript: "5.9.3" },
}

test("emits a valid CycloneDX 1.5 envelope with app metadata", () => {
  const bom = buildSbom(pkg, { timestamp: "2026-06-08T00:00:00Z" })
  assert.equal(bom.bomFormat, "CycloneDX")
  assert.equal(bom.specVersion, "1.5")
  assert.equal(bom.metadata.component.type, "application")
  assert.equal(bom.metadata.component.name, "vasa-eos-se")
  assert.equal(bom.metadata.timestamp, "2026-06-08T00:00:00Z")
})

test("each dependency becomes a library component with a clean purl", () => {
  const bom = buildSbom(pkg)
  const next = bom.components.find((c) => c.name === "next")
  assert.equal(next?.version, "15.2.4")
  assert.equal(next?.purl, "pkg:npm/next@15.2.4")
  const react = bom.components.find((c) => c.name === "react")
  assert.equal(react?.version, "19.0.0") // range stripped
})

test("scoped packages encode the @scope in the purl", () => {
  assert.equal(npmPurl("@radix-ui/react-slot", "~1.1.0"), "pkg:npm/%40radix-ui/react-slot@1.1.0")
})

test("dev deps are excluded by default, included on request", () => {
  assert.ok(!buildSbom(pkg).components.some((c) => c.name === "typescript"))
  const withDev = buildSbom(pkg, { includeDev: true })
  const ts = withDev.components.find((c) => c.name === "typescript")
  assert.equal(ts?.scope, "optional")
})

test("components are sorted and the summary counts scopes", () => {
  const bom = buildSbom(pkg, { includeDev: true })
  const names = bom.components.map((c) => c.name)
  assert.deepEqual([...names].slice(0, 4).sort(), names.slice(0, 4)) // required block sorted
  const s = sbomSummary(bom)
  assert.equal(s.components, 4)
  assert.equal(s.required, 3)
  assert.equal(s.optional, 1)
})
