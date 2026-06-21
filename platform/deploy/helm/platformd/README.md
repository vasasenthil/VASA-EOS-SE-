# platformd Helm chart

Deploys the VASA-EOS(SE) TN reference `platformd` onto the sovereign Kubernetes
cluster (gated B-010). The multi-arch image is published by CI to GHCR.

```sh
helm install vasa ./deploy/helm/platformd
# or raw manifests:
kubectl apply -f deploy/k8s/platformd.yaml
```

Non-root, read-only-rootfs, all caps dropped; readiness `/readiness`, liveness
`/healthz`. The HPA caps at 240 app replicas (the L10 capacity model's app-node
target for the crore-hour peak).
