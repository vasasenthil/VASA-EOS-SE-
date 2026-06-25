// Package alignments is the L11 international-alignment register (GLO-TN-001): the globally-recognised
// frameworks the platform is built to, each mapped to the in-mesh evidence that instruments it and an honest
// posture (instrumented / partial / pending). It is the Go-side counterpart to the TS governance registers —
// the same honest "one platform, one evidence chain, every framework" claim, made queryable in the mesh.
// Pure + stdlib-only.
package alignments

// Posture is how far an alignment is instrumented.
type Posture string

const (
	Instrumented Posture = "instrumented" // measured/enforced by a Go module or policy
	Partial      Posture = "partial"      // partially instrumented; some indicators pending
	Pending      Posture = "pending"      // awaits substrate or external audit
)

// Alignment is one international framework the platform aligns to.
type Alignment struct {
	Code       string  `json:"code"`
	Name       string  `json:"name"`
	Commitment string  `json:"commitment"`
	Posture    Posture `json:"posture"`
	Evidence   string  `json:"evidence"`
}

// Alignments returns the GLO-TN-001 framework register.
func Alignments() []Alignment {
	return []Alignment{
		{"SDG4", "UN SDG 4 — Quality Education", "Inclusive, equitable quality education + lifelong learning", Instrumented, "L8 engines (assessment) + L12 civic indicators"},
		{"SDG5", "UN SDG 5 — Gender Equality", "Girl-child equity, gender-disaggregated outcomes", Partial, "L12 civic equity indicators"},
		{"SDG10", "UN SDG 10 — Reduced Inequalities", "Social-category + rich-poor opportunity-gap closure", Partial, "policies/regulatory (RTE/RPwD) + civic indicators"},
		{"SDG16", "UN SDG 16 — Strong Institutions", "Accountable, transparent, auditable governance", Instrumented, "L5 audit + L11 govtiers + L12 RTI"},
		{"UNESCO-TES4", "UNESCO TES+4", "Country-action submittable transformation evidence", Partial, "L11 governance evidence chain"},
		{"UNICEF-GENU", "UNICEF GenU", "Youth dashboard interoperability", Partial, "L12 civic public dashboards"},
		{"WEF-ED40", "WEF Education 4.0", "Future-skills tagging in the curriculum graph", Instrumented, "L7 knowledgegraph (skills)"},
		{"OECD-PISA", "OECD PISA", "PISA-grade assessment instrumentation", Instrumented, "L8 engines (assessment)"},
		{"WB-STARS", "World Bank STARS / GovTech", "STARS reporting hooks; GovTech Stage-4 architecture", Partial, "L11 governance + operations/slo"},
		{"GPAI", "GPAI Principles", "AI Control Tower operationalises the principles", Instrumented, "L8 modelregistry + policies/ai/*"},
		{"UNESCO-AIETHICS", "UNESCO AI Ethics (10 principles)", "AI Ethics Board enforces the principles", Instrumented, "L11 control tower + policies/ai/{bias,drift,safety}"},
		{"ESG", "ESG (TCFD/GRI/IFRS S1+S2)", "Infrastructure footprint, gender equity, governance indicators", Pending, "external assurance (G7)"},
	}
}

// AlignmentFor returns a framework by code.
func AlignmentFor(code string) (Alignment, bool) {
	for _, a := range Alignments() {
		if a.Code == code {
			return a, true
		}
	}
	return Alignment{}, false
}

// Summary rolls up the alignment register.
type Summary struct {
	Total        int             `json:"total"`
	ByPosture    map[Posture]int `json:"by_posture"`
	Instrumented int             `json:"instrumented"`
}

// Summarise computes the alignment roll-up.
func Summarise() Summary {
	as := Alignments()
	s := Summary{Total: len(as), ByPosture: map[Posture]int{}}
	for _, a := range as {
		s.ByPosture[a.Posture]++
	}
	s.Instrumented = s.ByPosture[Instrumented]
	return s
}
