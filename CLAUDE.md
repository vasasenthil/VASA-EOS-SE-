# VASA-EOS(SE) — Project memory

AI-native Education Operating System for **school education**.

## Build mandate (IMPORTANT — non-negotiable, do not regress)
- **This is NOT an MVP / prototype / demo.** Build the **entire platform as per
  the repo** to be **deployment-ready, operationalise-grade, implementation-grade,
  enterprise-grade and government-grade** — full general/technical/functional
  features, real multi-tier workflows, durable persistence, audit, role-gated
  inboxes. No "broad but shallow" framing anywhere (code, docs, PR/commit text).
- Every turn ends **green** (see Green-bar requirement) and CI must be fully
  successful (all jobs, both Node 20.x + 22.x). Treat "some jobs were not
  successful" as a hard stop to diagnose and fix before moving on.
- Depth over breadth-claims: prefer finishing a feature end-to-end (form →
  approval → DB → audit → inbox, surfaced on every relevant feature) over listing
  capabilities. Be honest about what is wired to live data vs pending.

## Brochure build scope (IMPORTANT — locked until finished)
Directive: build the brochure (BRO-TN-002) pillars to "built", tracked by the
self-verifying register `lib/governance/brochure-coverage.ts` + `/governance/
brochure-coverage`. Drive these to built, one tested vertical at a time:
- **6 AI Engines** (Reasoning · Personalisation · Assessment · Policy · Analytics
  · Conversational) — `lib/ai/engines`.
- **6 AI Agents + 8 Native-AI pillars** (under human authority / HITL).
- **All 312 (brochure says 391) functional modules** across the 7 tiers.
- **NDEAR-S 29/29 + federation** (DIKSHA · UDISE+ · APAAR · PFMS) — live-shaped.
- **Scale to ~1.27 Cr students / ~69,000 schools** (validated).
- **WCAG 2.1 AAA across all routes**; **independent-audit register** kept honest
  (activities the platform truly does = pass; commissioned audits may fail).
- **OUT OF SCOPE (do NOT build):** sovereign infrastructure — HSM/state-held key
  custody, source-code escrow, off-switch, multi-cloud/data-residency topology.
  Keep `brochure-coverage` honest: leave those rows pending by design.
Each pillar moved to "built" must be real (no stubs), tested, green-bar, and the
register/its test updated to match.

## Scope & roadmap (IMPORTANT — keep in mind)
- **This platform is for the State of Tamil Nadu ONLY** at present. It is **not**
  an all-India / national deployment.
- **Roadmap:** add **more Indian states one by one**, and a **National level
  (Central Ministry of Education, India)** tier **later** — not now.
- The architecture already anticipates this: `lib/tenancy` models
  `national → state → directorate → district → block → cluster → school`, and
  `lib/access/scope` roots the live tree at **TN** today. Adding a state means
  adding a sibling state subtree; adding the Centre means anchoring states under a
  national node. **Do not** build other states or the national tier until asked;
  keep new work TN-scoped, but never hard-code assumptions that block adding them.

## Tech stack
- Next.js 15 (App Router), React 19, TypeScript 5.9.3, Tailwind, shadcn/ui.
- Layering per module: pure logic `lib/<m>/index.ts`; durable `lib/<m>/store.ts`
  (Supabase service-role via `lib/persistence.getDb()` or in-memory fallback);
  server actions `app/<m>/actions.ts`; client boards; server pages.
- Tests: Node 22 built-in runner + `--experimental-strip-types` (NO jest/vitest).
  Type-stripping limits: no enums/namespaces/parameter-properties.

## Commands (run binaries directly, NOT `pnpm run`)
- Typecheck: `./node_modules/.bin/tsc --noEmit`
- Tests + coverage gate (95 lines / 80 branches / 88 functions):
  `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --experimental-strip-types --experimental-test-coverage --test-coverage-exclude='tests/**' --test-coverage-exclude='scripts/**' --test-coverage-exclude='lib/supabase/**' --test-coverage-lines=95 --test-coverage-branches=80 --test-coverage-functions=88 --import ./scripts/test-register.mjs --test tests/*.test.ts`
- Lint: `./node_modules/.bin/next lint` · Build: `./node_modules/.bin/next build`

## Green-bar requirement (every turn)
tsc 0 errors · lint clean · build success · all tests pass · coverage ≥ gate.
Commit + push to `claude/platform-foundation`, then fast-forward `main`
(`git push origin origin/claude/platform-foundation:main`) so Vercel prod stays current.

## Per-role data scoping (ReBAC jurisdiction)
- Engine: `lib/access/scope.ts` (pure, tested) — downward governance: a subject
  governs its own tenant node + descendants. Enforcement seam:
  `lib/access/scope-server.ts` `scopeForCurrentSubject()` (fail-closed).
- To scope a module: add `tenantId` to its record type + `tenant_id` to the
  store/Row (+ migration `scripts/018`), seed across nodes, wrap the listing action
  in `scopeForCurrentSubject(...)`, update the board's optimistic object & test helper.
- Scoped so far: Safety, Discipline, CWSN, RBSK Health Referrals (workflow flow, scripts/042).

## Conventions
- Model id `claude-opus-4-8` must NOT appear in commits/PRs/code/artifacts (chat only).
- Do NOT create PRs unless explicitly asked. Demo password is demo-only; never ship
  real secrets. Commit/PR footer: https://claude.ai/code/session_01GjuK73nZFje1CyYWYvq3YA
