# ReBAC — relationship-derived access (CC-SPEC-001 §8.3). Composition contract for SpiceDB (Zanzibar).
# Phase 0 documents the contract; Phase 2 wires SpiceDB and OPA composes its check results here.
package vasa.access.rebac

import rego.v1

# Relationships that confer access (resolved by SpiceDB at runtime; modelled here as input.relationships):
#   parent  -> child         (view child's record)
#   teacher -> class         (manage class)
#   head    -> school        (manage school)
#   beo     -> block, deo -> district  (downward jurisdiction)
allow if {
	some rel in input.relationships
	rel.subject == input.subject.id
	rel.object == input.resource.id
	rel.relation in {"parent", "teacher", "head", "beo", "deo"}
}
