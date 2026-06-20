package integration

import (
	"sync"

	"github.com/vasa-eos-se-tn/platform/population"
)

// The institutional tree (385 blocks / 3,800 clusters / 69,000 schools) is materialised lazily on first
// access — it is deterministic and cheap, but generating ~69k records at every Platform boot would tax the
// test suite, so it is built once behind a sync.Once.
var (
	popOnce sync.Once
	popTree population.Tree
)

func tree() population.Tree {
	popOnce.Do(func() { popTree = population.BuildTree() })
	return popTree
}

// PopulationSummary returns the materialised institutional estate validated against the §D targets, plus the
// §D.1 person-scale plan the estate is sized to carry.
func (p *Platform) PopulationSummary() population.Summary {
	return population.Summarise(tree())
}

// SchoolsInDistrict returns the materialised schools in a real district (anchored to seed.Districts).
func (p *Platform) SchoolsInDistrict(district string) []population.School {
	var out []population.School
	for _, s := range tree().Schools {
		if s.District == district {
			out = append(out, s)
		}
	}
	return out
}

// SyntheticCohort materialises a labelled-synthetic cohort (students + teachers + their guardians) across the
// real institutional estate — a representative, clearly-synthetic population to exercise the platform. The ids
// are all SYN-prefixed; this never enters the production seed.
type SyntheticCohort struct {
	Students []population.Student `json:"students"`
	Teachers []population.Teacher `json:"teachers"`
	Parents  []population.Parent  `json:"parents"`
}

// SyntheticCohort builds a synthetic cohort of the requested size.
func (p *Platform) SyntheticCohort(students, teachers int) SyntheticCohort {
	t := tree()
	st := population.StudentSample(t, students)
	return SyntheticCohort{
		Students: st,
		Teachers: population.TeacherSample(t, teachers),
		Parents:  population.ParentSample(st),
	}
}
