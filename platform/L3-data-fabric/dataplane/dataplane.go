// Package dataplane is the VASA-EOS(SE) TN polyglot-persistence router (CC-SPEC-001 §18, §10.4).
//
// The data fabric spans many stores (Citus OLTP, ClickHouse OLAP, Cassandra time-series, MinIO blobs, Neo4j
// graph, Milvus vectors). Every write must land in the right store AND the right region, under the data
// classification and residency rules. This router answers, for a record: its classification class, the store
// it belongs in, the region it may reside in, and whether continued retention is due for erasure.
//
// Single source of truth for the RULES is the Rego plane (policies/data/*.rego). This package re-expresses
// the classification + residency + retention logic in Go for the hot write path, and a policy-parity test
// (dataplane_parity_test.go) cross-checks it against OPA on a category matrix so the two can never drift
// (§2.9: rules are authored once, in policy). The store-selection table below is infrastructure routing,
// which legitimately lives here.
package dataplane

// Class is the data sensitivity classification (policies/data/classification.rego, §18.3).
type Class string

const (
	Class1 Class = "class1" // identifiers / biometrics / financial / aadhaar / apaar
	Class2 Class = "class2" // sensitive: health / caste / religion / disability / marks
	Class3 Class = "class3" // general personal data (default)
	Class4 Class = "class4" // public / aggregated / suppressed
)

// Store is a backing datastore in the polyglot fabric.
type Store string

const (
	CitusOLTP      Store = "citus-oltp"      // transactional rows
	ClickHouseOLAP Store = "clickhouse-olap" // analytics / aggregates
	CassandraTS    Store = "cassandra-ts"    // high-volume time-series / events
	MinIOBlob      Store = "minio-blob"      // documents / media (encrypted at rest)
	Neo4jGraph     Store = "neo4j-graph"     // relationships / knowledge graph
	MilvusVector   Store = "milvus-vector"   // embeddings
)

// Region is a sovereign hosting region. Class-1/2 PII may reside ONLY in TN-SDC (§2.1, §18.3).
type Region string

const (
	TNSDC   Region = "TN-SDC"    // Tamil Nadu State Data Centre (primary, Chennai)
	TNSDCDR Region = "TN-SDC-DR" // DR (Coimbatore) — still within TN sovereignty
)

// classByCategory mirrors policies/data/classification.rego.
var class1Cats = set("identifier", "biometric", "financial", "aadhaar", "apaar")
var class2Cats = set("health", "caste", "religion", "disability", "marks")
var class4Cats = set("aggregate", "suppressed", "public")

// Classify returns the sensitivity class for a field category (default class3).
func Classify(category string) Class {
	switch {
	case class1Cats[category]:
		return Class1
	case class2Cats[category]:
		return Class2
	case class4Cats[category]:
		return Class4
	default:
		return Class3
	}
}

// Record describes a unit of data to be placed.
type Record struct {
	Category            string // field category (drives classification)
	Datatype            string // "row" | "event" | "blob" | "aggregate" | "graph" | "vector"
	Tenant              string
	Region              Region // requested placement region
	StatutoryHold       bool   // a legal hold preventing erasure
	DaysSincePurposeEnd int    // >0 means the purpose window has elapsed
}

// Placement is the routing decision.
type Placement struct {
	Class   Class
	Store   Store
	Region  Region
	Allowed bool
	Reasons []string // rule ids when Allowed is false (mirrors the policy rule ids)
}

// storeFor selects a store from the datatype, with classification as a tiebreaker.
func storeFor(datatype string, c Class) Store {
	switch datatype {
	case "event":
		return CassandraTS
	case "blob":
		return MinIOBlob
	case "aggregate":
		return ClickHouseOLAP
	case "graph":
		return Neo4jGraph
	case "vector":
		return MilvusVector
	default: // "row" and unknown → transactional store
		if c == Class4 {
			return ClickHouseOLAP // public aggregates are analytics-tier
		}
		return CitusOLTP
	}
}

// Route classifies a record, selects its store, and enforces residency. A Class-1/2 record requested outside
// TN sovereignty is denied (DATA-RESIDENCY) — fail-closed: Allowed is false and no store is offered.
func Route(r Record) Placement {
	c := Classify(r.Category)
	region := r.Region
	if region == "" {
		region = TNSDC
	}
	p := Placement{Class: c, Region: region, Store: storeFor(r.Datatype, c), Allowed: true}

	if (c == Class1 || c == Class2) && region != TNSDC && region != TNSDCDR {
		p.Allowed = false
		p.Store = ""
		p.Reasons = append(p.Reasons, "DATA-RESIDENCY")
	}
	return p
}

// RetentionDue reports whether continued retention must be erased (policies/data/retention.rego, DPDP §8(7)).
// Erasure is due when the purpose window has elapsed and no statutory hold applies.
func RetentionDue(r Record) (due bool, rule string) {
	if !r.StatutoryHold && r.DaysSincePurposeEnd > 0 {
		return true, "RETENTION-ERASE"
	}
	return false, ""
}

func set(xs ...string) map[string]bool {
	m := make(map[string]bool, len(xs))
	for _, x := range xs {
		m[x] = true
	}
	return m
}
