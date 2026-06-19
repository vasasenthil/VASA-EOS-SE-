# Protobuf contracts

The gRPC/Protobuf leg of the Spec-Engineering triad (OpenAPI 3.1 · AsyncAPI 3.0 · **Protobuf**) —
CC-SPEC-001 §11. `platform.proto` is the declarative contract for the platform's end-to-end workflows
(Admit · AskTutor · Retrieve · Remediate), mirroring the integration composition root.

Validated in CI with `protoc` (see `.github/workflows/platform.yml`):
```bash
protoc --proto_path=contracts/protobuf --descriptor_set_out=/dev/null contracts/protobuf/*.proto
```
Code generation (`protoc-gen-go` / `protoc-gen-go-grpc`) runs in the build that needs the stubs; the contract
is the source of truth, the Go stubs are generated artefacts.
