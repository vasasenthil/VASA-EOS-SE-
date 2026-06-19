// Package retrieval is the L7 policy-bound hybrid retriever (CC-SPEC-001 §16; the "Context Engineering — the
// Fuel · what informs" discipline). It fuses two signals — a keyword score (BM25-style term overlap, the
// "BM25" leg) and a graph-expansion boost over related curriculum concepts (the "Neo4j" leg; Milvus vector
// search is the third leg, gated on B-013) — then applies the POLICY BOUND AT RETRIEVAL: every candidate is
// filtered by tenant isolation (T0–T6) and data classification BEFORE it can ground an answer, so a learner
// can never be fed a document outside their jurisdiction or clearance. Deterministic + stdlib-only.
package retrieval

import (
	"math"
	"sort"
	"strings"
)

// Class is a document sensitivity class (mirrors policies/data/classification.rego ordering).
type Class int

const (
	Public     Class = iota // class4 — public/aggregated
	General                 // class3 — general
	Sensitive               // class2 — health/caste/marks
	Restricted              // class1 — identifiers/biometric/financial
)

// Doc is a retrievable document tagged with its tenant, class, and the concepts it covers.
type Doc struct {
	ID       string
	Text     string
	Tenant   string   // owning tenant ("" or "public" = visible to all tenants)
	Class    Class    // sensitivity class
	Concepts []string // curriculum concept ids this doc covers (for graph expansion)
}

// Clearance is the requester's retrieval jurisdiction: their tenant and the highest class they may read.
type Clearance struct {
	Tenant   string
	MaxClass Class
}

// GraphSource expands a concept to its related concepts (e.g. the knowledge graph's prerequisites/dependents).
type GraphSource interface {
	Related(concept string) []string
}

// VectorSource is the dense-retrieval leg (Milvus in production, gated on B-013). Similarity returns
// docID→score in [0,1] for a query embedding match; nil when no vector index is available, so retrieval
// degrades cleanly to keyword + graph. This is the third leg of "Milvus + BM25 + Neo4j" hybrid retrieval.
type VectorSource interface {
	Similarity(query string) map[string]float64
}

// VectorWeight scales the dense-retrieval contribution in the fused score.
const VectorWeight = 1.5

// Hit is a retrieved document with its fused score.
type Hit struct {
	Doc   Doc
	Score float64
}

// Retriever holds the corpus + the graph source + an optional vector source.
type Retriever struct {
	docs   []Doc
	graph  GraphSource
	vector VectorSource
}

// New builds a retriever over a corpus and an optional graph source (keyword + graph legs).
func New(docs []Doc, graph GraphSource) *Retriever {
	return &Retriever{docs: docs, graph: graph}
}

// NewHybrid builds the full three-leg retriever (keyword + graph + vector). The vector leg may be nil.
func NewHybrid(docs []Doc, graph GraphSource, vector VectorSource) *Retriever {
	return &Retriever{docs: docs, graph: graph, vector: vector}
}

// allowed enforces the policy bound: tenant isolation + classification clearance.
func allowed(d Doc, clr Clearance) bool {
	if d.Tenant != "" && d.Tenant != "public" && d.Tenant != clr.Tenant {
		return false // cross-tenant document — never surfaced
	}
	return d.Class <= clr.MaxClass // within the requester's clearance
}

// tokenize lowercases and splits into word tokens (len>2).
func tokenize(s string) map[string]int {
	out := map[string]int{}
	for _, w := range strings.FieldsFunc(strings.ToLower(s), func(r rune) bool {
		return !(r >= 'a' && r <= 'z') && !(r >= '0' && r <= '9')
	}) {
		if len(w) > 2 {
			out[w]++
		}
	}
	return out
}

// keywordScore is a BM25-ish overlap: sum of query-term frequencies in the doc, length-normalised.
func keywordScore(q map[string]int, text string) float64 {
	dt := tokenize(text)
	if len(dt) == 0 {
		return 0
	}
	var s float64
	for term := range q {
		if tf, ok := dt[term]; ok {
			// saturating tf (BM25 k1≈1.2) over a soft length norm
			s += (float64(tf) * 2.2) / (float64(tf) + 1.2)
		}
	}
	return s / math.Sqrt(float64(len(dt)))
}

// Retrieve returns the top-k allowed documents for a query, fusing keyword score with a graph-expansion boost
// for docs that cover the query concept or a related concept. Policy is applied BEFORE ranking is returned.
func Retrieve(r *Retriever, query, concept string, clr Clearance, k int) []Hit {
	q := tokenize(query)

	// graph expansion: the target concept + its related concepts get a retrieval boost.
	related := map[string]bool{concept: true}
	if r.graph != nil && concept != "" {
		for _, c := range r.graph.Related(concept) {
			related[c] = true
		}
	}

	// dense-retrieval leg (Milvus): docID→similarity, or nil when no vector index is available.
	var sims map[string]float64
	if r.vector != nil {
		sims = r.vector.Similarity(query)
	}

	var hits []Hit
	for _, d := range r.docs {
		if !allowed(d, clr) { // POLICY BOUND AT RETRIEVAL — applied to every leg
			continue
		}
		score := keywordScore(q, d.Text) // BM25 leg
		for _, c := range d.Concepts {   // graph leg
			if related[c] {
				score += 1.0
			}
		}
		if sims != nil { // vector leg
			score += VectorWeight * sims[d.ID]
		}
		if score > 0 {
			hits = append(hits, Hit{Doc: d, Score: round3(score)})
		}
	}
	sort.Slice(hits, func(i, j int) bool {
		if hits[i].Score != hits[j].Score {
			return hits[i].Score > hits[j].Score
		}
		return hits[i].Doc.ID < hits[j].Doc.ID
	})
	if k > 0 && len(hits) > k {
		hits = hits[:k]
	}
	return hits
}

func round3(v float64) float64 { return math.Round(v*1000) / 1000 }
