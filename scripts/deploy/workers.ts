import { readFileSync } from "node:fs"
import { renderImage } from "./render-image.ts"
import { spawnSync } from "node:child_process"

class WorkerDeployError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "WorkerDeployError"
  }
}

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new WorkerDeployError(`${name} is required for sovereign worker deployment`)
  return value
}

function run(cmd: string, args: string[]): void {
  console.log(`$ ${cmd} ${args.join(" ")}`)
  const result = spawnSync(cmd, args, { stdio: "inherit", env: process.env })
  if (result.status !== 0) throw new WorkerDeployError(`${cmd} ${args.join(" ")} failed`)
}

function main(): void {
  const registry = requireEnv("SOVEREIGN_REGISTRY")
  const imageTag = process.env.IMAGE_TAG ?? process.env.GITHUB_SHA ?? requireEnv("IMAGE_TAG")
  const namespace = process.env.K8S_NAMESPACE ?? "vasa-eos-se"
  const context = requireEnv("KUBE_CONTEXT")
  const image = `${registry}/vasa-workers:${imageTag}`
  const kubectl = (args: string[]) => run("kubectl", ["--context", context, "-n", namespace, ...args])

  // Images were already built, scanned and pushed by CI. Render before apply;
  // never briefly create pods using a placeholder or rebuild during deployment.
  kubectl(["apply", "-f", "infra/workers/worker-service-account.yaml"])
  for (const file of ["infra/workers/outbox-dispatcher-deployment.yaml", "infra/workers/sla-monitor-deployment.yaml", "infra/k8s/vasa-workers-deployment.yaml"]) {
    const manifest = renderImage(readFileSync(file, "utf8"), image)
    const result = spawnSync("kubectl", ["--context", context, "-n", namespace, "apply", "-f", "-"], { input: manifest, stdio: ["pipe", "inherit", "inherit"] })
    if (result.status !== 0) throw new WorkerDeployError(`Apply failed: ${file}`)
  }

  kubectl(["rollout", "status", "deployment/vasa-outbox-dispatcher", "--timeout=180s"])
  kubectl(["rollout", "status", "deployment/vasa-sla-monitor", "--timeout=180s"])
  kubectl(["rollout", "status", "deployment/pfms-reconciliation", "--timeout=180s"])
}

try {
  main()
} catch (error) {
  console.error(error)
  process.exit(1)
}
