import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"
import { renderImage } from "../scripts/deploy/render-image"

test("app manifest renders the exact CI image while retaining ServiceAccount and Service", () => {
  const source = readFileSync("infra/k8s/vasa-app-deployment.yaml", "utf8")
  const rendered = renderImage(source, "registry.example/vasa-app:abc123")
  assert.match(rendered, /image: registry.example\/vasa-app:abc123/)
  assert.doesNotMatch(rendered, /CHANGE_ME/)
  assert.match(rendered, /kind: ServiceAccount/)
  assert.match(rendered, /path: \/api\/ready/)
  assert.match(rendered, /path: \/api\/live/)
})
test("image renderer rejects unresolved or ambiguous deployment images", () => {
  assert.throws(() => renderImage("image: old", "registry/app:latest"))
  assert.throws(() => renderImage("image: old\nimage: other", "registry/app:abc"))
  assert.throws(() => renderImage("image: old", "registry/app:CHANGE_ME"))
})
