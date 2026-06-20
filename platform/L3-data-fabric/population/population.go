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

// School is a school under a cluster, with a generated UDISE+-shaped code and a realistic management category.
type School struct {
	UDISE      string `json:"udise"`
	Name       string `json:"name"`
	Cluster    string `json:"cluster"`
	Block      string `json:"block"`
	District   string `json:"district"`
	Management string `json:"management"`
}

// managementFor assigns a realistic management category by deterministic index (≈65% Government, 15% Aided,
// 15% Matriculation, 5% Private-CBSE — the broad TN distribution).
func managementFor(i int) string {
	switch m := i % 20; {
	case m < 13:
		return "Government"
	case m < 16:
		return "Aided"
	case m < 19:
		return "Matriculation"
	default:
		return "Private-CBSE"
	}
}

// Tree is the materialised institutional estate.
type Tree struct {
	Blocks   []Block
	Clusters []Cluster
	Schools  []School
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
					t.Schools = append(t.Schools, School{
						UDISE: udise, Name: fmt.Sprintf("%s School %d", clusterID, s+1),
						Cluster: clusterID, Block: blockID, District: district, Management: managementFor(schoolSerial),
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

// Summary is the population roll-up: the materialised tree counts, validated against the §D targets, plus the
// scale plan the estate is sized for.
type Summary struct {
	Districts  int            `json:"districts"`
	Blocks     int            `json:"blocks"`
	Clusters   int            `json:"clusters"`
	Schools    int            `json:"schools"`
	TreeValid  bool           `json:"tree_valid"` // materialised counts hit the §D targets exactly
	Management map[string]int `json:"management_mix"`
	Scale      ScalePlan      `json:"scale_plan"`
}

// Summarise validates a materialised tree against the §D targets and rolls up the management mix.
func Summarise(t Tree) Summary {
	tgtD, tgtB, tgtC, tgtS := Targets()
	mix := map[string]int{}
	for _, s := range t.Schools {
		mix[s.Management]++
	}
	districts := map[string]bool{}
	for _, b := range t.Blocks {
		districts[b.District] = true
	}
	s := Summary{
		Districts: len(districts), Blocks: len(t.Blocks), Clusters: len(t.Clusters), Schools: len(t.Schools),
		Management: mix, Scale: ScalePlanTN(),
	}
	s.TreeValid = s.Districts == tgtD && s.Blocks == tgtB && s.Clusters == tgtC && s.Schools == tgtS
	return s
}
