// Package seed implements the DAT-TN-001 seed-data inventory + loader (CC-SPEC-001 §24 Phase 0/1). It holds
// the minimum complete data set the platform must hold at first boot — the State's reference master data,
// the law-as-code, the curriculum canon, the institutional roles — and loads it under the SEED RULE: signed
// by the authority before load, loaded once idempotently with rollback, lineage preserved, and synthetic
// seed NEVER mixed with production. Stdlib-only.
package seed

// ── Section A.1 / C.1 · the State's reference master data ──────────────────────

// Districts are Tamil Nadu's 38 revenue districts (GEOGRAPHY-MASTER).
var Districts = []string{
	"Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore", "Dharmapuri", "Dindigul", "Erode",
	"Kallakurichi", "Kancheepuram", "Kanniyakumari", "Karur", "Krishnagiri", "Madurai", "Mayiladuthurai",
	"Nagapattinam", "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai", "Ramanathapuram", "Ranipet", "Salem",
	"Sivaganga", "Tenkasi", "Thanjavur", "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli", "Tirupathur",
	"Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur", "Vellore", "Viluppuram", "Virudhunagar",
}

// Directorate is one of the 7 directorates (DIRECTORATE-MASTER).
type Directorate struct {
	Code, Name string
}

// Directorates are the 7 school-education directorates (A.1).
var Directorates = []Directorate{
	{"DSE", "Directorate of School Education"},
	{"DEE", "Directorate of Elementary Education"},
	{"DGE", "Directorate of Government Examinations"},
	{"DMS", "Directorate of Matriculation Schools"},
	{"DTERT", "Directorate of Teacher Education, Research & Training (SCERT)"},
	{"DPSE", "Directorate of Private Schools & Pre-Primary Education"},
	{"DNFE", "Directorate of Non-Formal & Adult Education"},
}

// Language is a seeded language (LANGUAGE-MASTER), with its ISO-639 code; Tamil is first/primary.
type Language struct {
	Code, Name string
	Primary    bool
}

// Languages are the 22 scheduled Indian languages, Tamil first (A.1, SEED-LANGUAGES).
var Languages = []Language{
	{"ta", "Tamil", true},
	{"as", "Assamese", false}, {"bn", "Bengali", false}, {"brx", "Bodo", false}, {"doi", "Dogri", false},
	{"gu", "Gujarati", false}, {"hi", "Hindi", false}, {"kn", "Kannada", false}, {"ks", "Kashmiri", false},
	{"kok", "Konkani", false}, {"mai", "Maithili", false}, {"ml", "Malayalam", false}, {"mni", "Manipuri", false},
	{"mr", "Marathi", false}, {"ne", "Nepali", false}, {"or", "Odia", false}, {"pa", "Punjabi", false},
	{"sa", "Sanskrit", false}, {"sat", "Santali", false}, {"sd", "Sindhi", false}, {"te", "Telugu", false},
	{"ur", "Urdu", false},
}

// RPwDCategories are the 21 specified disabilities under the RPwD Act 2016 (DISABILITY-MASTER).
var RPwDCategories = []string{
	"Blindness", "Low-vision", "Leprosy Cured persons", "Hearing Impairment (Deaf and Hard of Hearing)",
	"Locomotor Disability", "Dwarfism", "Intellectual Disability", "Mental Illness",
	"Autism Spectrum Disorder", "Cerebral Palsy", "Muscular Dystrophy", "Chronic Neurological conditions",
	"Specific Learning Disabilities", "Multiple Sclerosis", "Speech and Language disability", "Thalassemia",
	"Hemophilia", "Sickle Cell disease", "Multiple Disabilities including deafblindness", "Acid Attack victim",
	"Parkinson's disease",
}

// NEPStage is one stage of the NEP 2020 5+3+3+4 structure (CURRICULUM-MASTER).
type NEPStage struct {
	Name   string
	Years  int
	Grades string
}

// NEPStructure is the 5+3+3+4 schooling structure (SEED-CURRICULUM).
var NEPStructure = []NEPStage{
	{"Foundational", 5, "Pre-KG, LKG, UKG, Grades 1-2"},
	{"Preparatory", 3, "Grades 3-5"},
	{"Middle", 3, "Grades 6-8"},
	{"Secondary", 4, "Grades 9-12"},
}

// Classes are the seeded class levels (CLASS-MASTER, SEED-CLASSES).
var Classes = []string{
	"Pre-KG", "LKG", "UKG", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7",
	"Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12",
}

// Scheme is a seeded welfare/education scheme (SCHEME-MASTER, SEED-SCHEME-CATALOGUE).
type Scheme struct {
	Code, Name, Owner string
}

// Schemes are the active TN + Central schemes (A.1).
var Schemes = []Scheme{
	{"PM-POSHAN", "Mid-day meal (noon meal) scheme", "DEE"},
	{"RTE-25", "RTE Act §12 25% EWS/DG admission", "DPSE"},
	{"PUDHUMAI-PENN", "Pudhumai Penn higher-education scholarship", "DSE"},
	{"MMSN", "Mudhalvar Makkal Sevai Nanbar", "DSE"},
	{"UNIFORMS", "Free school uniforms", "DEE"},
	{"TEXTBOOKS", "Free textbooks", "DEE"},
	{"TRANSPORT", "Student transport assistance", "DSE"},
	{"SCHOLARSHIP-SCST", "SC/ST/OBC/MBC/DNT/EWS scholarships", "DSE"},
}

// Roles are the institutional role catalogue (SEED-ROLES); citizen identities are NOT seeded (C.6).
var Roles = []string{
	"STUDENT", "PARENT", "TEACHER", "HEAD_TEACHER", "CRC", "BRC", "BEO", "DEO", "CEO", "DIRECTOR_DSE",
	"SECRETARY", "AUDITOR", "PIO", "CITIZEN", "VENDOR", "RESEARCHER",
}

// Counts are the indicative steady-state reference cardinalities (A.1 / D.1) — large sets are seeded as
// counts/generators, not literals, at first boot.
var Counts = map[string]int{
	"districts": 38,
	"blocks":    385,
	"clusters":  3800,
	"schools":   69000,
}
