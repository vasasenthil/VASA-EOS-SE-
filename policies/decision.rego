# Composed decision — deny-wins, then require-approval, then permit (CC-SPEC-001 §8 sequence).
# This is the contract every PEP evaluates (Kong, Istio, app middleware, DB RLS gate, MinIO, Kafka).
package vasa.decision

import rego.v1
import data.vasa.access.pbac
import data.vasa.access.rbac

default effect := "permit"

effect := "deny" if count(pbac.deny) > 0
effect := "require-approval" if {
	count(pbac.deny) == 0
	count(pbac.require_approval) > 0
}

# RBAC is a precondition: if the role does not grant the action at all, that is also a deny.
effect := "deny" if {
	not rbac.allow
	# only applies when a role is present to evaluate
	input.subject.role
}

governing := pbac.deny if effect == "deny"
governing := pbac.require_approval if effect == "require-approval"
governing := set() if effect == "permit"
