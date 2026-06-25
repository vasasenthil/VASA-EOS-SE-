# POCSO Act 2012 + JJ Act 2015 — Policy-as-Code (CC-SPEC-001 §2.5, §17.5)
package vasa.regulatory.pocso

import rego.v1

# Child-safety due diligence — staff with access to children must clear background verification before appointment.
deny contains d if {
	input.action == "staff.appoint"
	not input.resource.backgroundVerified
	d := {
		"rule": "POCSO-BGV",
		"act": "POCSO 2012 / child-safety",
		"citation": "Personnel with access to children must clear background verification before appointment.",
	}
}

# §2.5 — no private 1:1 adult-minor channel; all such channels must be supervised/audited.
deny contains d if {
	input.action == "channel.open"
	input.resource.adultMinorPrivate == true
	not input.resource.supervised
	d := {
		"rule": "POCSO-NO-PRIVATE-CHANNEL",
		"act": "POCSO 2012 / JJ Act 2015",
		"citation": "Adult-minor private channels are prohibited; all communication is audited and observable to a guardian or institutional adult.",
	}
}
