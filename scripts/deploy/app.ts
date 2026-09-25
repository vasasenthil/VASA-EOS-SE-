import { readFileSync } from "node:fs"
import { spawnSync } from "node:child_process"
import { renderImage } from "./render-image.ts"

const registry = process.env.SOVEREIGN_REGISTRY
const tag = process.env.IMAGE_TAG ?? process.env.GITHUB_SHA
const context = process.env.KUBE_CONTEXT
if (!registry || !tag || !context) throw new Error("SOVEREIGN_REGISTRY, IMAGE_TAG and KUBE_CONTEXT are required")
const args = ["--context", context, "-n", process.env.K8S_NAMESPACE ?? "vasa-eos-se"]
const manifest = renderImage(readFileSync("infra/k8s/vasa-app-deployment.yaml", "utf8"), `${registry}/vasa-app:${tag}`)
const applied = spawnSync("kubectl", [...args, "apply", "-f", "-"], { input: manifest, stdio: ["pipe", "inherit", "inherit"] })
if (applied.status !== 0) throw new Error("App apply failed")
const rollout = spawnSync("kubectl", [...args, "rollout", "status", "deployment/vasa-app", "--timeout=180s"], { stdio: "inherit" })
if (rollout.status !== 0) throw new Error("App rollout failed")
