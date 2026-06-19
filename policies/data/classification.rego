# Data classification (Class 1-4) — CC-SPEC-001 §18.3
package vasa.data.classification

import rego.v1

# Class of a data field by category. Class 1 = identifiers/biometrics/financial; Class 4 = public/aggregated.
class := "class1" if input.field.category in {"identifier", "biometric", "financial", "aadhaar", "apaar"}
class := "class2" if {
	not input.field.category in {"identifier", "biometric", "financial", "aadhaar", "apaar"}
	input.field.category in {"health", "caste", "religion", "disability", "marks"}
}
class := "class4" if input.field.category in {"aggregate", "suppressed", "public"}

default class := "class3"  # general personal data
