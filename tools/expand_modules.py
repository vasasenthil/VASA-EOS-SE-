#!/usr/bin/env python3
"""CC-SPEC-001 §12 — materialise per-folder modules/M<id>-<slug>/module.yaml from modules/catalogue.yaml.
The catalogue is the single source of truth; this expands the §12 per-folder layout on demand."""
import os
from gen_catalogue import emit
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
n = 0
for m in emit():
    d = os.path.join(ROOT, "modules", f"{m['id']}-{m['slug']}")
    os.makedirs(d, exist_ok=True)
    rs = ('"' + m["reference_source"] + '"') if m["reference_source"] else "null"
    open(os.path.join(d, "module.yaml"), "w").write(
        f"id: {m['id']}\nname: \"{m['name']}\"\nlayer: {m['layer']}\ndomain: {m['domain']}\n"
        f"owner: {m['owner']}\ncompliance: [{', '.join(m['compliance'])}]\n"
        f"policy_bundles: [{', '.join(m['policy_bundles'])}]\nreference_source: {rs}\nstatus: {m['status']}\n")
    n += 1
print(f"materialised {n} per-folder module.yaml")
