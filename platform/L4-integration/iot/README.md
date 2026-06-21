# iot — L4 IoT-mesh ingestion + OTA

Sovereign ingestion seam for device telemetry (biometric attendance · environment ·
nutrition · infrastructure). Each reading is **classified** (biometric attendance is
**Class-1** personal data), validated, **residency-gated** (Class-1 must stay TN-
sovereign — offshore is quarantined, never stored), routed to the timeseries `Sink`
seam, and audited. A `Fleet` tracks device firmware and rolls out **OTA** to online
devices (offline devices reconcile on reconnect via the edge layer).

The EMQX broker + K3s edge hardware are gated (B-010/B-013); this is the logic that
runs on them. Deterministic + stdlib-only. 2 tests.
