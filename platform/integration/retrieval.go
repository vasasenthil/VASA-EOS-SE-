package integration

import "github.com/vasa-eos-se-tn/platform/retrieval"

// SetRetriever wires the L7 policy-bound hybrid retriever so the tutor can ground answers in cleared content.
func (p *Platform) SetRetriever(r *retrieval.Retriever) { p.Retriever = r }

// retrieve returns the ids of the top policy-bound documents grounding a learner question. The learner's
// clearance is their tenant at General class (they cannot retrieve sensitive/restricted material). The
// retriever enforces tenant isolation + classification BEFORE returning anything.
func (p *Platform) retrieve(query, concept, tenant string) []string {
	clr := retrieval.Clearance{Tenant: tenant, MaxClass: retrieval.General}
	var ids []string
	for _, h := range retrieval.Retrieve(p.Retriever, query, concept, clr, 3) {
		ids = append(ids, h.Doc.ID)
	}
	return ids
}
