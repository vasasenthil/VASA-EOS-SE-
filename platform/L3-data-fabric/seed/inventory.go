package seed

// regulatoryBundles are the law-as-code Rego bundles (SEED-OPA-BUNDLES / SEED-POLICY).
var regulatoryBundles = []string{
	"access.rbac", "access.rebac", "access.abac", "access.pbac",
	"regulatory.rte", "regulatory.dpdp", "regulatory.rpwd", "regulatory.pocso", "regulatory.pfms_gfr", "regulatory.rti",
	"ai.safety", "ai.bias", "ai.drift", "data.classification", "data.residency", "data.retention",
}

var subjects = []string{"Tamil", "English", "Mathematics", "Science", "Social Science", "Computer Science", "Vocational"}
var headsOfAccount = []string{"2202-General-Education", "2202-Elementary", "2202-Secondary", "2236-Nutrition", "PFMS-sanction", "GFR-ledger"}
var relationshipTaxonomy = []string{"parentOf", "guardianOf", "teaches", "headOf", "mentors", "supervises", "auditsScope"}
var governanceWorkflows = []string{"G1-cabinet", "G2-empowered", "G3-district", "G4-academic", "G5-director", "G6-ethics", "G7-audit"}
var schemeWorkflowStages = []string{"eligibility", "sanction", "disbursement", "acknowledgement", "reconciliation"}

func sv(s []string) func() any { return func() any { return s } }

// Inventory returns the full production seed inventory in dependency-ordered phases (DAT-TN-001 §C.8).
func Inventory() []Item {
	return []Item{
		// ── PHASE 0 · bootstrap ──
		{ID: "SEED-LANGUAGES", Phase: "S0-1", Category: MasterReference, Source: "Secretariat", Steward: "Secretariat", PII: Class4, Payload: func() any { return Languages }},
		{ID: "SEED-DISABILITIES", Phase: "S0-2", Category: MasterReference, Source: "RPwD-2021-Review", Steward: "G6 Ethics, Equity", PII: Class4, Payload: func() any { return RPwDCategories }},
		{ID: "SEED-ROLES", Phase: "S0-3", Category: Identity, Source: "Secretariat", Steward: "Secretariat", PII: Class4, Payload: sv(Roles)},
		{ID: "SEED-OPA-BUNDLES", Phase: "S0-4", Category: Governance, Source: "Law Department", Steward: "G6 Security & Compliance", PII: Class4, Payload: sv(regulatoryBundles)},

		// ── PHASE 1 · foundation ──
		{ID: "SEED-GEOGRAPHY", Phase: "S1-1", Category: MasterReference, Source: "TN Gazette + UDISE+", Steward: "DSE Programme Director + UDISE+ Nodal", PII: Class4, Payload: func() any { return map[string]any{"districts": Districts, "counts": Counts} }},
		{ID: "SEED-DIRECTORATES", Phase: "S1-2", Category: MasterReference, Source: "Secretariat", Steward: "Secretariat", PII: Class4, Payload: func() any { return Directorates }},
		{ID: "SEED-OFFICES", Phase: "S1-3", Category: Identity, Source: "Secretariat", Steward: "Secretariat", PII: Class4, Deps: []string{"SEED-GEOGRAPHY", "SEED-DIRECTORATES"}, Payload: func() any {
			return map[string]int{"ceo_deo": 38, "beo": 385, "brc_crc": 3800, "directorate_rosters": 7}
		}},
		{ID: "SEED-CCA-CAS", Phase: "S1-4", Category: CredentialLedger, Source: "CCA-empanelled", Steward: "G6", PII: Class4, Payload: func() any { return []string{"CCA-empanelled CA trust store"} }},
		{ID: "SEED-CALENDAR", Phase: "S1-5", Category: MasterReference, Source: "DSE", Steward: "DSE", PII: Class4, Payload: func() any {
			return map[string]any{"academic_year": "2026-27", "terms": 3, "calendar": "Tamil/Gregorian"}
		}},

		// ── PHASE 2 · data + security ──
		{ID: "SEED-SCHOOLS", Phase: "S2-1", Category: MasterReference, Source: "UDISE+", Steward: "DSE + UDISE+ Nodal", PII: Class4, Deps: []string{"SEED-GEOGRAPHY"}, Payload: func() any {
			return map[string]any{"records": Counts["schools"], "categories": []string{"Government", "Aided", "Matriculation", "Private-CBSE", "KGBV", "Adi-Dravidar", "Pre-KG-linked"}}
		}},
		{ID: "SEED-CLASSES", Phase: "S2-2", Category: MasterReference, Source: "DSE/DGE", Steward: "DSE", PII: Class4, Payload: sv(Classes)},
		{ID: "SEED-SUBJECTS", Phase: "S2-3", Category: MasterReference, Source: "SCERT", Steward: "SCERT Director", PII: Class4, Payload: sv(subjects)},
		{ID: "SEED-FINANCIAL", Phase: "S2-4", Category: MasterReference, Source: "Treasury/Finance", Steward: "PFMS Nodal + Finance Lead", PII: Class4, Payload: sv(headsOfAccount)},
		{ID: "SEED-RELATIONSHIPS", Phase: "S2-5", Category: Identity, Source: "Secretariat", Steward: "Secretariat", PII: Class4, Deps: []string{"SEED-ROLES"}, Payload: sv(relationshipTaxonomy)},

		// ── PHASE 3 · platform + integration ──
		{ID: "SEED-CURRICULUM", Phase: "S3-1", Category: Knowledge, Source: "NCERT + SCERT", Steward: "SCERT Director", PII: Class4, Payload: func() any { return NEPStructure }},
		{ID: "SEED-SCHEME-CATALOGUE", Phase: "S3-2", Category: MasterReference, Source: "Directorates", Steward: "Respective directorate", PII: Class4, Payload: func() any { return Schemes }},
		{ID: "SEED-G1-G7-WORKFLOWS", Phase: "S3-3", Category: Governance, Source: "Secretariat", Steward: "G1-G7 bodies", PII: Class4, Payload: sv(governanceWorkflows)},
		{ID: "SEED-POLICY", Phase: "S3-4", Category: Governance, Source: "Law Department", Steward: "G6 Security & Compliance", PII: Class4, Deps: []string{"SEED-OPA-BUNDLES"}, Payload: sv(regulatoryBundles)},

		// ── PHASE 4 · Native-AI (the model/content seeds; the real weights/vectors are gated) ──
		{ID: "SEED-TEXTBOOKS", Phase: "S4-1", Category: Knowledge, Source: "NCERT + SCERT + TN Textbook Corp", Steward: "SCERT Director", PII: Class4, Payload: func() any { return map[string]string{"base": "NCERT", "state": "SCERT-TN"} }},
		{ID: "SEED-KNOWLEDGE-GRAPH", Phase: "S4-2", Category: Knowledge, Source: "NCERT + SCERT", Steward: "Chief AI Architect (G5)", PII: Class4, Gated: "B-013", Payload: func() any { return "curriculum + concept + prerequisite graph (Neo4j)" }},
		{ID: "SEED-EMBEDDINGS", Phase: "S4-3", Category: Knowledge, Source: "TN-canon corpus", Steward: "G5", PII: Class4, Gated: "B-013", Payload: func() any { return "dense + sparse vectors (Milvus)" }},
		{ID: "SEED-TN-CANON", Phase: "S4-4", Category: Knowledge, Source: "Law Department + DSE", Steward: "G6 Ethics Chair", PII: Class4, Payload: func() any { return "RTE/RPwD/DPDP/POCSO texts + active TN GOs, indexed" }},
		{ID: "SEED-LLM-WEIGHTS", Phase: "S4-5", Category: AIOperational, Source: "TN-SDC", Steward: "Chief AI Architect (G5)", PII: Class4, Gated: "B-011", Payload: func() any { return []string{"Llama-3.x-8B", "Llama-3.x-70B", "Mistral-Large"} }},
		{ID: "SEED-INDIC-MODELS", Phase: "S4-6", Category: AIOperational, Source: "AI4Bharat", Steward: "G5", PII: Class4, Gated: "B-011", Payload: func() any { return []string{"IndicTrans2", "IndicConformer-ASR", "IndicTTS"} }},
		{ID: "SEED-CLASSIFIERS", Phase: "S4-7", Category: AIOperational, Source: "TN-SDC", Steward: "G6", PII: Class4, Payload: func() any { return []string{"POCSO-content", "bias-detector", "jailbreak", "PII-detector"} }},
		{ID: "SEED-PROMPT-LIBRARY", Phase: "S4-8", Category: AIOperational, Source: "G6-reviewed", Steward: "G6", PII: Class4, Payload: func() any { return map[string]string{"version": "v1", "scope": "per-agent prompts, signed"} }},
		{ID: "SEED-MODEL-CARDS", Phase: "S4-9", Category: AIOperational, Source: "G6", Steward: "G6 Ethics Chair", PII: Class4, Payload: func() any { return "one model card per seed model (ABV + bias + red-team + deploy-with-approval)" }},
		{ID: "SEED-EVAL-SUITES", Phase: "S4-10", Category: AIOperational, Source: "SCERT", Steward: "G5", PII: Class4, Payload: func() any { return []string{"FLN", "NAS-equivalent", "PISA-grade"} }},
		{ID: "SEED-PRACTICE-BANK", Phase: "S4-11", Category: Knowledge, Source: "SCERT", Steward: "SCERT Director", PII: Class4, Payload: func() any { return "IRT-calibrated, accessibility-accommodated practice items" }},
		{ID: "SEED-SCHEME-WORKFLOWS", Phase: "S4-12", Category: Governance, Source: "Directorates", Steward: "PFMS Nodal", PII: Class4, Deps: []string{"SEED-SCHEME-CATALOGUE"}, Payload: sv(schemeWorkflowStages)},
		{ID: "SEED-GRIEVANCE-WORKFLOW", Phase: "S4-13", Category: Governance, Source: "Secretariat", Steward: "G6", PII: Class4, Payload: func() any {
			return []string{"intake", "classification", "triage", "jurisdiction", "redress", "satisfaction"}
		}},
		{ID: "SEED-POCSO-WORKFLOW", Phase: "S4-14", Category: Governance, Source: "Law Department", Steward: "G6", PII: Class4, Payload: func() any {
			return []string{"mandatory-reporting", "designated-officer-notification", "evidence-chain-of-custody"}
		}},
	}
}

// SyntheticInventory returns the Section C.7 synthetic test seed (NON-PRODUCTION; an egress guard blocks it
// from any production datastore — the Loader rejects these when production=true).
func SyntheticInventory() []Item {
	return []Item{
		{ID: "SYN-STUDENTS", Phase: "C7", Category: Identity, Source: "synthetic", Steward: "Dev", PII: Class4, Synthetic: true, Payload: func() any { return map[string]int{"students": 10000, "districts": 5, "schoolsPerDistrict": 5} }},
		{ID: "SYN-TEACHERS", Phase: "C7", Category: Identity, Source: "synthetic", Steward: "Dev", PII: Class4, Synthetic: true, Payload: func() any { return map[string]int{"teachers": 500} }},
		{ID: "SYN-SCHOOLS", Phase: "C7", Category: MasterReference, Source: "synthetic", Steward: "Dev", PII: Class4, Synthetic: true, Payload: func() any { return map[string]int{"schools": 25} }},
		{ID: "SYN-PARENTS", Phase: "C7", Category: Identity, Source: "synthetic", Steward: "Dev", PII: Class4, Synthetic: true, Payload: func() any { return map[string]int{"guardians": 15000} }},
		{ID: "SYN-WORKFLOWS", Phase: "C7", Category: Governance, Source: "synthetic", Steward: "Dev", PII: Class4, Synthetic: true, Payload: func() any { return []string{"scheme-delivery", "grievance", "attendance"} }},
	}
}
