#!/usr/bin/env python3
"""CC-SPEC-001 §13 §26.4 — generate OpenAPI 3.1 + AsyncAPI 3.0 contracts per domain from the catalogue.

Clients/servers are GENERATED from these contracts (§26.4), never hand-written. Phase 0 emits one
OpenAPI + one AsyncAPI per domain, with a resource path / event channel per module — a structured
scaffold that a code-generator (oapi-codegen / openapi-generator / asyncapi gen) expands in later phases.

Run: python3 tools/gen_contracts.py   (after tools/gen_catalogue.py)
"""
import os
from gen_catalogue import emit

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def openapi_for(domain, mods):
    L = [
        "openapi: 3.1.0",
        "info:",
        f"  title: \"VASA-EOS(SE) TN — {domain} API\"",
        "  version: 0.1.0",
        f"  description: \"CC-SPEC-001 §13 generated contract for the {domain} domain. Every operation is "
        "policy-gated (OPA) and audited; PII fields are DPDP-classified.\"",
        "servers:",
        "  - url: https://api.vasa-eos.tn.gov.in/v1",
        "tags:",
    ]
    for m in mods:
        L.append(f"  - name: {m['id']}")
        L.append(f"    description: \"{m['name']}\"")
    L.append("paths:")
    for m in mods:
        base = f"/{m['slug']}"
        L += [
            f"  {base}:",
            f"    get: {{ tags: [{m['id']}], summary: \"List {m['name']}\", responses: {{ '200': {{ description: ok }} }} }}",
            f"    post: {{ tags: [{m['id']}], summary: \"Create {m['name']}\", responses: {{ '201': {{ description: created }}, '403': {{ description: 'policy denied' }} }} }}",
            f"  {base}/{{id}}:",
            "    parameters: [ { name: id, in: path, required: true, schema: { type: string } } ]",
            f"    get: {{ tags: [{m['id']}], summary: \"Get {m['name']}\", responses: {{ '200': {{ description: ok }}, '404': {{ description: 'not found' }} }} }}",
            f"    patch: {{ tags: [{m['id']}], summary: \"Update {m['name']}\", responses: {{ '200': {{ description: ok }}, '403': {{ description: 'policy denied' }} }} }}",
        ]
    L += [
        "components:",
        "  securitySchemes:",
        "    oidc: { type: openIdConnect, openIdConnectUrl: https://iam.vasa-eos.tn.gov.in/.well-known/openid-configuration }",
        "security: [ { oidc: [] } ]",
    ]
    return "\n".join(L) + "\n"

def asyncapi_for(domain, mods):
    L = [
        "asyncapi: 3.0.0",
        "info:",
        f"  title: \"VASA-EOS(SE) TN — {domain} events\"",
        "  version: 0.1.0",
        f"  description: \"CC-SPEC-001 §13 generated AsyncAPI for {domain}. Kafka backbone; AVRO/Protobuf via "
        "schema registry; every consequential event is notarised to the audit ledger.\"",
        "channels:",
    ]
    for m in mods:
        L += [
            f"  {m['slug']}.events:",
            f"    address: \"vasa.{domain}.{m['slug']}\"",
            f"    description: \"Domain events for {m['name']}\"",
            "    messages:",
            f"      changed: {{ name: {m['id']}Changed, contentType: application/json }}",
    ]
    L.append("operations:")
    for m in mods:
        L += [
            f"  on{m['id']}Changed:",
            "    action: receive",
            f"    channel: {{ $ref: '#/channels/{m['slug']}.events' }}",
        ]
    return "\n".join(L) + "\n"

if __name__ == "__main__":
    entries = emit()
    by_domain = {}
    for e in entries:
        by_domain.setdefault(e["domain"], []).append(e)
    n_oa = n_aa = 0
    for domain, mods in by_domain.items():
        open(os.path.join(ROOT, "contracts", "openapi", f"{domain}.yaml"), "w").write(openapi_for(domain, mods)); n_oa += 1
        open(os.path.join(ROOT, "contracts", "asyncapi", f"{domain}.yaml"), "w").write(asyncapi_for(domain, mods)); n_aa += 1
    print(f"generated {n_oa} OpenAPI + {n_aa} AsyncAPI contracts covering {len(entries)} modules across {len(by_domain)} domains")
