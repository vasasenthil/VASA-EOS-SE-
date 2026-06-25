package integration

import "github.com/vasa-eos-se-tn/platform/retrieval"

// SetRetriever wires the L7 policy-bound hybrid retriever so the tutor can ground answers in cleared content.
func (p *Platform) SetRetriever(r *retrieval.Retriever) { p.Retriever = r }

// RetrieveSources returns the ids of the top policy-bound documents for a query (the public accessor over the
// L7 hybrid retriever). Returns nil when no retriever is wired.
func (p *Platform) RetrieveSources(query, concept, tenant string) []string {
	if p.Retriever == nil {
		return nil
	}
	return p.retrieve(query, concept, tenant)
}

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
