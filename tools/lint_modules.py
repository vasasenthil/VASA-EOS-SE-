#!/usr/bin/env python3
"""CC-SPEC-001 §12 §3 — module catalogue linter (CI compliance gate).

Asserts: exactly 391 modules (329 core + 62 TN); unique ids M0001..M0391 contiguous; every module
declares ≥1 compliance clause, an owner, a layer, and ≥1 policy bundle; the committed
modules/catalogue.yaml is in sync with the generator (no drift). Exit non-zero on any violation.

Run: python3 tools/lint_modules.py [--require-compliance]
"""
import os, sys
from gen_catalogue import emit, yaml_dump

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def main():
    e = emit()
    errors = []
    if len(e) != 391:
        errors.append(f"expected 391 modules, got {len(e)}")
    core = [m for m in e if m["domain"] != "tn-specific"]
    tn = [m for m in e if m["domain"] == "tn-specific"]
    if len(core) != 329:
        errors.append(f"expected 329 core modules, got {len(core)}")
    if len(tn) != 62:
        errors.append(f"expected 62 TN-specific modules, got {len(tn)}")
    ids = [m["id"] for m in e]
    if len(set(ids)) != len(ids):
        errors.append("duplicate module ids")
    for i, m in enumerate(e, start=1):
        if m["id"] != f"M{i:04d}":
            errors.append(f"non-contiguous id at position {i}: {m['id']}")
            break
    for m in e:
        if not m["compliance"]:
            errors.append(f"{m['id']} declares no compliance clause")
        if not m["owner"] or not m["layer"]:
            errors.append(f"{m['id']} missing owner/layer")
        if not m["policy_bundles"]:
            errors.append(f"{m['id']} declares no policy bundle (PEP enforcement)")
    # drift: committed catalogue.yaml must equal the generator output
    p = os.path.join(ROOT, "modules", "catalogue.yaml")
    if os.path.exists(p):
        if open(p).read() != yaml_dump(e):
            errors.append("modules/catalogue.yaml is stale — run: python3 tools/gen_catalogue.py")
    else:
        errors.append("modules/catalogue.yaml missing — run the generator")

    if errors:
        print("MODULE LINT FAILED:")
        for x in errors:
            print("  -", x)
        sys.exit(1)
    print(f"module lint OK · {len(e)} modules ({len(core)} core + {len(tn)} TN) · all declare compliance + owner + layer + policy bundle")

if __name__ == "__main__":
    main()
