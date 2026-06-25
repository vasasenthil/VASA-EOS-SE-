# CI/CD templates (CC-SPEC-001 §22)
Reusable GitLab CI templates per workspace. Pipeline stages (in order, all must pass): validate · build ·
test · security · integration · performance · accessibility · fairness · package · deploy · verify · attest.
These templates are scaffolds; they execute when the toolchain (OPA, Trivy, Semgrep, k6, Axe) and runners
exist. The `security.yml` `no-demo` job enforces ADR-0005 on production surfaces.
