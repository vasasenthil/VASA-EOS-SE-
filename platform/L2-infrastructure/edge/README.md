# edge — L2 edge-compute offline-first CRDT sync

A school on a flaky link keeps working **offline** and converges with the State on
reconnect — **no lost writes, no coordinator**. State-based CRDTs whose merge is
commutative, associative and idempotent, so replicas applying the same operations
in any order reach the same state:

- **LWWRegister** — last-write-wins single value (e.g. a pupil's current class).
- **GCounter** — grow-only counter (cumulative offline attendance).
- **ORSet** — observed-remove set, **add-wins** (the enrolled APAAR set; a concurrent
  re-enrolment beats a concurrent removal — the safe default).

The K3s/Pi5/Jetson hardware is gated (B-010); this is the sovereign sync logic that
runs on it. Pure + stdlib-only. 4 tests (incl. convergence + add-wins).
