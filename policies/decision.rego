# Composed decision — deny-wins, then require-approval, then permit (CC-SPEC-001 §8 sequence).
# This is the contract every PEP evaluates (Kong, Istio, app middleware, DB RLS gate, MinIO, Kafka).
package vasa.decision

import rego.v1

import data.vasa.access.pbac
import data.vasa.access.rbac

# A request is DENIED if any regulatory bundle denies it, OR (when a role is present) RBAC does not grant the
# action at all. Folding both into one predicate keeps `effect` single-valued (no rule conflict).
denied if count(pbac.deny) > 0

denied if {
	input.subject.role
	not rbac.allow
}

default effect := "permit"

effect := "deny" if denied

effect := "require-approval" if {
	not denied
	count(pbac.require_approval) > 0
}

# The rules that drove the decision (for the audit record / the PEP's explanation).
governing := pbac.deny if effect == "deny"

governing := pbac.require_approval if effect == "require-approval"

governing := set() if effect == "permit"
