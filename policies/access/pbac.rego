# PBAC — layered regulatory policy bundles atop ABAC (CC-SPEC-001 §8.5). Deny-wins across regimes.
package vasa.access.pbac

import rego.v1
import data.vasa.regulatory.rte
import data.vasa.regulatory.dpdp
import data.vasa.regulatory.rpwd
import data.vasa.regulatory.pocso
import data.vasa.regulatory.pfms_gfr

# All regulatory denials, unioned (any one denies the request).
deny contains d if some d in rte.deny
deny contains d if some d in dpdp.deny
deny contains d if some d in rpwd.deny
deny contains d if some d in pocso.deny
deny contains d if some d in pfms_gfr.deny

# All regulatory approval-gates, unioned.
require_approval contains d if some d in rte.require_approval
require_approval contains d if some d in pfms_gfr.require_approval
