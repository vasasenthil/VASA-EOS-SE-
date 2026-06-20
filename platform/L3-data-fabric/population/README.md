# population — TN institutional estate + population at §D scale

Materialises the Tamil-Nadu education estate so the platform is **populated and exercisable end-to-end**, at
the DAT-TN-001 §D scale, **without ever fabricating real personal data.**

## What is real vs. synthetic (the honest line)

- **Real, anchored geography:** the institutional tree is built on the **real 38 districts** (`seed.Districts`)
  and the real §D counts. Blocks, clusters and schools are distributed across them so the totals hit
  **385 / 3,800 / 69,000 exactly**, with TN-shaped UDISE codes (`33…`) and a realistic management mix
  (~65% Government, 15% Aided, 15% Matriculation, 5% Private-CBSE). The identifiers are systematically
  generated, but the geography they hang from is real.
- **Synthetic, clearly-labelled people:** students, teachers and guardians are **synthetic by construction** —
  every id is `SYN-`-prefixed (`SYN-APAAR-…`, `SYN-TCH-…`, `SYN-PAR-…`) and every record carries
  `synthetic: true`. They are anchored to the real estate (a real district + a generated school code) but are
  never passed off as real personal data and never enter the production seed (the SEED RULE's synthetic-egress
  guard still applies).
- **Scale validated arithmetically:** the full §D.1 cohort (≈1.27 Cr students, 6 L teachers, 2.75 Cr parents)
  is expressed as a `ScalePlan` and validated, rather than materialised in memory; `StudentSample(n)` produces
  a representative synthetic cohort for live exercise.

## API

```go
tree := population.BuildTree()                 // 385 blocks · 3,800 clusters · 69,000 schools (deterministic)
population.Summarise(tree)                      // counts validated against §D + management mix + scale plan
population.StudentSample(tree, n)               // n synthetic, SYN-labelled students across the real estate
population.TeacherSample(tree, n)               // synthetic teaching + non-teaching staff
population.ParentSample(students)               // one synthetic guardian per student
population.ScalePlanTN()                        // the §D.1 person-scale the estate is sized for
```

## Surfaced

`integration.Platform` materialises the tree lazily (once, behind a `sync.Once`). `platformd` serves
`GET /population` (summary · `?district=NAME` · `?cohort=N`).

Deterministic; stdlib-only. 5 module tests.
