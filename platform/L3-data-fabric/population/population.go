// Package population materialises the Tamil-Nadu institutional estate and its population at DAT-TN-001 §D
// scale. The institutional tree — 38 districts → 385 blocks → 3,800 clusters → 69,000 schools — is generated
// deterministically and ANCHORED TO THE REAL 38 districts (seed.Districts), so the geography is real even
// though the school/block/cluster identifiers are systematically generated. The person population (students,
// teachers, parents) is SYNTHETIC by construction and labelled as such (every id is prefixed `SYN-`), held
// apart from production per the SEED RULE — the platform is populated and exercisable end-to-end without ever
// passing fabricated data off as real personal data. Deterministic + stdlib-only.
package population

import (
	"fmt"

	"github.com/vasa-eos-se-tn/platform/seed"
)

// stateCode is Tamil Nadu's UDISE+ state code.
const stateCode = "33"

// ── §D.1 target cardinalities (from seed.Counts, the real reference figures) ──

// Targets returns the institutional target counts (the real §D.1 / A.1 cardinalities).
func Targets() (districts, blocks, clusters, schools int) {
	return seed.Counts["districts"], seed.Counts["blocks"], seed.Counts["clusters"], seed.Counts["schools"]
}

// distribute spreads total items across n buckets as evenly as possible, giving the first (total mod n)
// buckets one extra. It returns the per-bucket counts; sum == total exactly.
func distribute(total, n int) []int {
	out := make([]int, n)
	if n == 0 {
		return out
	}
	base, extra := total/n, total%n
	for i := range out {
		out[i] = base
		if i < extra {
			out[i]++
		}
	}
	return out
}

// ── Institutional entities ──

// Block is a block/BRC under a district.
type Block struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	District string `json:"district"`
}

// Cluster is a cluster/CRC under a block.
type Cluster struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Block    string `json:"block"`
	District string `json:"district"`
}

// School is a school under a cluster, fully classified across the five TN school-taxonomy dimensions:
// management category, educational level (grade span), medium of instruction, gender composition and
// residential type — each stamped deterministically at a realistic distribution (the codes/structure are real
// even though the per-school assignment is generated).
type School struct {
	UDISE       string `json:"udise"`
	Name        string `json:"name"`
	Cluster     string `json:"cluster"`
	Block       string `json:"block"`
	District    string `json:"district"`
	Management  string `json:"management"`  // Government · Aided · Matriculation · CBSE · …
	Level       string `json:"level"`       // Primary · Upper Primary · High · Higher Secondary
	Grades      string `json:"grades"`      // grade span, e.g. "1–12"
	Medium      string `json:"medium"`      // Tamil · English · …
	Gender      string `json:"gender"`      // Co-educational · Girls · Boys
	Residential string `json:"residential"` // Day · Residential · KGBV
}

// managementFor assigns a realistic management category by deterministic index (≈65% Government, 15% Aided,
// 15% Matriculation, ~3% CBSE, plus a tail of central/private/social-welfare/municipal forms).
func managementFor(i int) string {
	switch m := i % 40; {
	case m < 26:
		return "Government"
	case m < 32:
		return "Government-Aided"
	case m < 37:
		return "Matriculation (Self-Financing)"
	case m == 37:
		return "Private-CBSE"
	case m == 38:
		return "Central Government (KV/JNV)"
	default:
		return "Municipal / Corporation"
	}
}

// levelFor assigns an educational level (returns name + grade span) at the broad TN ratio: most schools are
// primary, then a tail of upper-primary, high and higher-secondary.
func levelFor(i int) (name, grades string) {
	switch l := i % 20; {
	case l < 11: // ~55% Primary
		return "Primary School", "1–5"
	case l < 15: // ~20% Upper Primary / Middle
		return "Upper Primary / Middle School", "1–8"
	case l < 18: // ~15% High
		return "High School", "1–10"
	default: // ~10% Higher Secondary
		return "Higher Secondary School", "1–12"
	}
}

// mediumFor assigns a medium of instruction — Tamil-dominant, then English, then a tail of other state
// languages in border districts.
func mediumFor(i int) string {
	switch m := i % 20; {
	case m < 13:
		return "Tamil"
	case m < 18:
		return "English"
	case m == 18:
		return "Telugu"
	default:
		return "Urdu"
	}
}

// genderFor assigns gender composition — overwhelmingly co-educational, with girls'/boys' schools at the
// secondary level.
func genderFor(i int) string {
	switch g := i % 20; {
	case g < 17:
		return "Co-educational"
	case g < 19:
		return "Girls"
	default:
		return "Boys"
	}
}

// residentialFor assigns a residential type — almost all day schools, with a few residential and the KGBV
// girls' residential schools.
func residentialFor(i int) string {
	switch r := i % 50; {
	case r < 47:
		return "Day"
	case r < 49:
		return "Residential"
	default:
		return "KGBV"
	}
}

// Tree is the materialised institutional estate.
type Tree struct {
	Blocks   []Block
	Clusters []Cluster
	Schools  []School
}

// SchoolFilter narrows a school query across the taxonomy dimensions; an empty field matches anything.
type SchoolFilter struct {
	District    string
	Management  string
	Level       string
	Medium      string
	Gender      string
	Residential string
}

func match(want, got string) bool { return want == "" || want == got }

// FilterSchools returns the schools matching every non-empty filter field (e.g. all Girls Higher-Secondary
// Tamil-medium Government schools in a district).
func FilterSchools(t Tree, f SchoolFilter) []School {
	var out []School
	for _, s := range t.Schools {
		if match(f.District, s.District) && match(f.Management, s.Management) && match(f.Level, s.Level) &&
			match(f.Medium, s.Medium) && match(f.Gender, s.Gender) && match(f.Residential, s.Residential) {
			out = append(out, s)
		}
	}
	return out
}

// BuildTree generates the full institutional tree anchored to the real districts. Blocks are distributed
// across the 38 districts, clusters across blocks, and schools across clusters, so the totals hit the §D
// targets (385 / 3,800 / 69,000) exactly. Deterministic: the same call always yields byte-identical output.
func BuildTree() Tree {
	districts := seed.Districts
	_, nBlocks, nClusters, nSchools := Targets()

	blocksPerDistrict := distribute(nBlocks, len(districts))
	var t Tree
	schoolSerial := 0

	clusterAlloc := distribute(nClusters, nBlocks) // per-block cluster counts, indexed by global block #
	schoolByCluster := distribute(nSchools, nClusters)
	globalBlock, globalCluster := 0, 0

	for di, district := range districts {
		dcode := fmt.Sprintf("%s%02d", stateCode, di+1)
		for b := 0; b < blocksPerDistrict[di]; b++ {
			blockID := fmt.Sprintf("%s-B%02d", dcode, b+1)
			t.Blocks = append(t.Blocks, Block{ID: blockID, Name: fmt.Sprintf("%s Block %d", district, b+1), District: district})
			for c := 0; c < clusterAlloc[globalBlock]; c++ {
				clusterID := fmt.Sprintf("%s-C%02d", blockID, c+1)
				t.Clusters = append(t.Clusters, Cluster{ID: clusterID, Name: fmt.Sprintf("%s Cluster %d", blockID, c+1), Block: blockID, District: district})
				for s := 0; s < schoolByCluster[globalCluster]; s++ {
					schoolSerial++
					udise := fmt.Sprintf("%s%07d", dcode, schoolSerial)
					levelName, grades := levelFor(schoolSerial)
					t.Schools = append(t.Schools, School{
						UDISE: udise, Name: fmt.Sprintf("%s School %d", clusterID, s+1),
						Cluster: clusterID, Block: blockID, District: district,
						Management: managementFor(schoolSerial), Level: levelName, Grades: grades,
						Medium: mediumFor(schoolSerial), Gender: genderFor(schoolSerial), Residential: residentialFor(schoolSerial),
					})
				}
				globalCluster++
			}
			globalBlock++
		}
	}
	return t
}

// ── Synthetic person population (labelled SYN-, never production) ──

// Student is a SYNTHETIC student anchored to a real school, with a synthetic APAAR-shaped id.
type Student struct {
	APAAR     string `json:"apaar"` // SYN-APAAR-… — synthetic by construction
	UDISE     string `json:"udise"`
	District  string `json:"district"`
	Class     string `json:"class"`
	Synthetic bool   `json:"synthetic"`
}

// Teacher is a SYNTHETIC teacher anchored to a real school.
type Teacher struct {
	ID        string `json:"id"` // SYN-TCH-…
	UDISE     string `json:"udise"`
	District  string `json:"district"`
	Teaching  bool   `json:"teaching"` // teaching vs non-teaching staff
	Synthetic bool   `json:"synthetic"`
}

// Parent is a SYNTHETIC guardian linked to a synthetic student.
type Parent struct {
	ID        string `json:"id"` // SYN-PAR-…
	StudentAP string `json:"student_apaar"`
	Synthetic bool   `json:"synthetic"`
}

// StudentSample materialises n synthetic students spread across the institutional tree's schools. Used to
// exercise the platform with a representative, clearly-synthetic cohort (the full §D 1.27-crore cohort is
// validated arithmetically via ScalePlan rather than materialised in memory).
func StudentSample(t Tree, n int) []Student {
	out := make([]Student, 0, n)
	if len(t.Schools) == 0 || n <= 0 {
		return out
	}
	for i := 0; i < n; i++ {
		sc := t.Schools[i%len(t.Schools)]
		out = append(out, Student{
			APAAR:     fmt.Sprintf("SYN-APAAR-%012d", i+1),
			UDISE:     sc.UDISE,
			District:  sc.District,
			Class:     seed.Classes[i%len(seed.Classes)],
			Synthetic: true,
		})
	}
	return out
}

// TeacherSample materialises n synthetic teachers (≈75% teaching, 25% non-teaching) across the tree's schools.
func TeacherSample(t Tree, n int) []Teacher {
	out := make([]Teacher, 0, n)
	if len(t.Schools) == 0 || n <= 0 {
		return out
	}
	for i := 0; i < n; i++ {
		sc := t.Schools[i%len(t.Schools)]
		out = append(out, Teacher{
			ID:        fmt.Sprintf("SYN-TCH-%09d", i+1),
			UDISE:     sc.UDISE,
			District:  sc.District,
			Teaching:  i%4 != 0,
			Synthetic: true,
		})
	}
	return out
}

// ParentSample materialises one synthetic guardian per supplied synthetic student.
func ParentSample(students []Student) []Parent {
	out := make([]Parent, 0, len(students))
	for i, s := range students {
		out = append(out, Parent{ID: fmt.Sprintf("SYN-PAR-%012d", i+1), StudentAP: s.APAAR, Synthetic: true})
	}
	return out
}

// ── §D scale plan + validation ──

// ScalePlan is the §D.1 person-population target the institutional estate is sized to carry.
type ScalePlan struct {
	Students             int64 `json:"students"`
	TeachersTeaching     int64 `json:"teachers_teaching"`
	TeachersNonTeaching  int64 `json:"teachers_non_teaching"`
	Parents              int64 `json:"parents"`
	Schools              int   `json:"schools"`
	AvgStudentsPerSchool int   `json:"avg_students_per_school"`
}

// ScalePlanTN returns the §D.1 person-scale plan for Tamil Nadu (≈1.27 Cr students etc.).
func ScalePlanTN() ScalePlan {
	const students, teach, nonTeach, parents = 12_700_000, 450_000, 150_000, 27_500_000
	schools := seed.Counts["schools"]
	return ScalePlan{
		Students: students, TeachersTeaching: teach, TeachersNonTeaching: nonTeach, Parents: parents,
		Schools: schools, AvgStudentsPerSchool: students / schools,
	}
}

// Summary is the population roll-up: the materialised tree counts, validated against the §D targets, the full
// school-taxonomy breakdown (the five dimensions), and the scale plan the estate is sized for.
type Summary struct {
	Districts   int            `json:"districts"`
	Blocks      int            `json:"blocks"`
	Clusters    int            `json:"clusters"`
	Schools     int            `json:"schools"`
	TreeValid   bool           `json:"tree_valid"` // materialised counts hit the §D targets exactly
	Management  map[string]int `json:"management_mix"`
	Level       map[string]int `json:"level_mix"`
	Medium      map[string]int `json:"medium_mix"`
	Gender      map[string]int `json:"gender_mix"`
	Residential map[string]int `json:"residential_mix"`
	Scale       ScalePlan      `json:"scale_plan"`
}

// Summarise validates a materialised tree against the §D targets and rolls up every school-taxonomy dimension
// (management · level · medium · gender · residential).
func Summarise(t Tree) Summary {
	tgtD, tgtB, tgtC, tgtS := Targets()
	mgmt, level, medium, gender, resi := map[string]int{}, map[string]int{}, map[string]int{}, map[string]int{}, map[string]int{}
	for _, s := range t.Schools {
		mgmt[s.Management]++
		level[s.Level]++
		medium[s.Medium]++
		gender[s.Gender]++
		resi[s.Residential]++
	}
	districts := map[string]bool{}
	for _, b := range t.Blocks {
		districts[b.District] = true
	}
	s := Summary{
		Districts: len(districts), Blocks: len(t.Blocks), Clusters: len(t.Clusters), Schools: len(t.Schools),
		Management: mgmt, Level: level, Medium: medium, Gender: gender, Residential: resi, Scale: ScalePlanTN(),
	}
	s.TreeValid = s.Districts == tgtD && s.Blocks == tgtB && s.Clusters == tgtC && s.Schools == tgtS
	return s
}
