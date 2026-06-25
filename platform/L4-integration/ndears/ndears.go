// Package ndears is the L4 NDEAR-S (National Digital Education Architecture — Sunbird ED stack) conformance
// register: the 29 NDEAR building blocks the platform must conform to (Cover Brief "NDEAR-S 29/29 — Sunbird ED
// stack conformance"). Each block records the conformance posture in the Go mesh — `conformant` when a Go
// module/policy implements its sovereign analogue, `federated` when it is reached through an L4 adapter, and
// `pending` when it is gated on the live DPI substrate (B-022). The register is self-counting: exactly 29
// blocks, and the headline 29/29 is computed, never asserted blindly. Pure + stdlib-only.
package ndears

// Status is a block's conformance posture.
type Status string

const (
	Conformant Status = "conformant" // a sovereign Go analogue implements the block
	Federated  Status = "federated"  // reached through an L4 adapter to the live DPI
	Pending    Status = "pending"    // gated on live DPI credentials (B-022)
)

// Block is one NDEAR-S building block.
type Block struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Category string `json:"category"`
	Status   Status `json:"status"`
	Evidence string `json:"evidence"` // the Go module/policy or adapter that delivers it
}

// Blocks returns the 29 NDEAR-S building blocks and their conformance posture in the Go mesh.
func Blocks() []Block {
	return []Block{
		// Registries (Electronic Registries — RC)
		{"REG-LEARNER", "Learner Registry (APAAR)", "Registry", Federated, "L4 adapters/apaar"},
		{"REG-TEACHER", "Teacher Registry", "Registry", Federated, "L4 adapters/hrms"},
		{"REG-SCHOOL", "School Registry (UDISE+)", "Registry", Federated, "L4 adapters/udise"},
		{"REG-CONTENT", "Content Registry", "Registry", Conformant, "L7 knowledgegraph"},
		{"REG-CREDENTIAL", "Credential Registry", "Registry", Conformant, "L7 credentials + notary"},
		{"REG-ASSESSMENT", "Assessment Item Registry", "Registry", Conformant, "L8 engines (assessment)"},
		{"REG-SCHEME", "Scheme / Entitlement Registry", "Registry", Conformant, "L3 seed (scheme catalogue)"},
		{"REG-ORG", "Organisation Registry", "Registry", Conformant, "L6 tenancy (T0–T6)"},
		// Identity, access & consent
		{"ID-AUTH", "Authentication", "Identity", Pending, "B-010 Keycloak"},
		{"ID-CONSENT", "Consent Management", "Identity", Conformant, "L3 consent (DPDP)"},
		{"ID-ROLE", "Role & Access (RBAC/ABAC)", "Identity", Conformant, "policies/access/*"},
		{"ID-PROFILE", "Federated Learning Profile", "Identity", Conformant, "L7 knowledgegraph (learner)"},
		// Content & knowledge
		{"CON-INGEST", "Content Ingestion / Sourcing", "Content", Conformant, "L3 onboarding gate"},
		{"CON-TAXONOMY", "Curriculum Taxonomy / Framework", "Content", Conformant, "L3 seed (NEP) + knowledgegraph"},
		{"CON-DISCOVERY", "Content Discovery / Search", "Content", Conformant, "L7 retrieval"},
		{"CON-DIKSHA", "DIKSHA Content Federation", "Content", Federated, "L4 adapters/diksha"},
		// Assessment & credentialing
		{"ASMT-DELIVERY", "Assessment Delivery", "Assessment", Conformant, "L8 serving + engines"},
		{"ASMT-SCORING", "Scoring & Analytics", "Assessment", Conformant, "L8 engines (assessment+analytics)"},
		{"CRED-ISSUE", "Verifiable Credential Issuance", "Credential", Conformant, "L7 credentials"},
		{"CRED-VERIFY", "Credential Verification", "Credential", Conformant, "L7 notary inclusion proofs"},
		{"CRED-LOCKER", "DigiLocker Push", "Credential", Federated, "L4 adapters/digilocker"},
		// Finance & welfare
		{"FIN-PFMS", "PFMS Fund-Flow", "Finance", Federated, "L4 adapters/pfms"},
		{"FIN-DBT", "DBT / Benefit Transfer", "Finance", Federated, "L4 adapters/bsp (APBS)"},
		// Platform services
		{"SVC-NOTIFY", "Notification", "Service", Conformant, "L6 notify"},
		{"SVC-WORKFLOW", "Workflow / BPMN", "Service", Conformant, "L6 workflow"},
		{"SVC-TELEMETRY", "Telemetry / Analytics", "Service", Conformant, "operations/slo + audit"},
		{"SVC-AUDIT", "Audit / Tamper-Evidence", "Service", Conformant, "L5 audit hash-chain"},
		{"SVC-I18N", "Multilingual / Localisation", "Service", Conformant, "L6 i18n (22 languages)"},
		{"SVC-GRIEVANCE", "Grievance Redress", "Service", Conformant, "L12 civic (grievance tracker)"},
	}
}

// Summary is the NDEAR-S conformance roll-up.
type Summary struct {
	Total     int            `json:"total"`
	ByStatus  map[Status]int `json:"by_status"`
	Sovereign int            `json:"sovereign"` // conformant via a Go analogue
	Federated int            `json:"federated"` // via an L4 adapter
	Pending   int            `json:"pending"`   // gated on live DPI
	Headline  string         `json:"headline"`  // "N/29 addressed"
}

// Summarise computes the conformance roll-up. "Addressed" = conformant + federated (a block is addressed when
// the Go mesh implements its analogue or reaches it through an adapter); pending blocks await live DPI creds.
func Summarise() Summary {
	bs := Blocks()
	s := Summary{Total: len(bs), ByStatus: map[Status]int{}}
	for _, b := range bs {
		s.ByStatus[b.Status]++
	}
	s.Sovereign = s.ByStatus[Conformant]
	s.Federated = s.ByStatus[Federated]
	s.Pending = s.ByStatus[Pending]
	addressed := s.Sovereign + s.Federated
	s.Headline = itoa(addressed) + "/" + itoa(len(bs)) + " addressed"
	return s
}

func itoa(n int) string {
	if n == 0 {
		return "0"
	}
	var b []byte
	for n > 0 {
		b = append([]byte{byte('0' + n%10)}, b...)
		n /= 10
	}
	return string(b)
}
