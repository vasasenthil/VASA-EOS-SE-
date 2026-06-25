package seed

// ── School taxonomy master data (A.1 / CLASS+SCHOOL-MASTER) ───────────────────
// The canonical Tamil Nadu school classifications the platform holds as reference data: educational LEVEL
// (grade span), MANAGEMENT category, MEDIUM of instruction, GENDER composition, and RESIDENTIAL type. These
// are real TN classifications; the population layer stamps every materialised school with one value per
// dimension at a realistic distribution.

// SchoolLevel is a school's educational level and the grade span it serves.
type SchoolLevel struct {
	Code      string // PS | UPS | HS | HSS
	Name      string
	Grades    string // human grade span
	FromGrade int
	ToGrade   int
}

// SchoolLevels are the four TN school levels by grade span (NEP-aligned).
var SchoolLevels = []SchoolLevel{
	{"PS", "Primary School", "1–5", 1, 5},
	{"UPS", "Upper Primary / Middle School", "1–8", 1, 8},
	{"HS", "High School", "1–10", 1, 10},
	{"HSS", "Higher Secondary School", "1–12", 1, 12},
}

// SchoolCategory is a management category (who runs the school).
type SchoolCategory struct {
	Code, Name string
}

// SchoolCategories are the TN management categories (SCHOOL-MASTER).
var SchoolCategories = []SchoolCategory{
	{"GOVT", "Government"},
	{"AIDED", "Government-Aided"},
	{"MATRIC", "Matriculation (Self-Financing)"},
	{"CBSE", "Private-CBSE"},
	{"PRIVATE", "Private-Unaided"},
	{"CENTRAL", "Central Government (KV/JNV)"},
	{"SWD", "Social Welfare / Adi-Dravidar"},
	{"MUNICIPAL", "Municipal / Corporation"},
}

// Mediums are the languages of instruction offered across TN schools (Tamil first).
var Mediums = []string{"Tamil", "English", "Telugu", "Kannada", "Malayalam", "Urdu"}

// GenderTypes are the gender-composition classifications of a school.
var GenderTypes = []string{"Co-educational", "Girls", "Boys"}

// ResidentialTypes are the residential classifications (day vs residential, incl. the KGBV girls' residential).
var ResidentialTypes = []string{"Day", "Residential", "KGBV"}
