package seed

import (
	"crypto/ed25519"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"sort"
	"strings"
	"sync"
	"time"
)

// PIIClass is the Section E.1 4-class data classification (1 = most sensitive).
type PIIClass int

const (
	Class1 PIIClass = 1 // biometrics, financial credentials, health, sexual identity
	Class2 PIIClass = 2 // name, address, guardian, DOB, social category, disability
	Class3 PIIClass = 3 // academic record, scheme entitlement, grievance
	Class4 PIIClass = 4 // aggregated, suppressed, public
)

// Category is a Section A data category.
type Category string

const (
	MasterReference  Category = "A-master"
	Identity         Category = "B-identity"
	Knowledge        Category = "E-knowledge"
	Governance       Category = "F-governance"
	AIOperational    Category = "G-ai"
	CredentialLedger Category = "H-credential"
)

// Item is one seed unit in the dependency-ordered inventory (Section C / C.8).
type Item struct {
	ID        string // e.g. SEED-LANGUAGES
	Phase     string // e.g. S0-1
	Category  Category
	Source    string     // the contracted source/steward upstream
	Steward   string     // Section F.1 data steward
	PII       PIIClass   // Section E.1 classification
	Synthetic bool       // Section C.7 — synthetic seed (never production)
	Gated     string     // a BLOCKERS id when the real payload needs the substrate (catalogue entry still seeds)
	Deps      []string   // prerequisite seed ids
	Payload   func() any // the records this seed loads (lazily); hashed for the checksum
}

// records counts the payload (a slice length, else 1).
func (it Item) records() int {
	if it.Payload == nil {
		return 0
	}
	v := it.Payload()
	switch s := v.(type) {
	case []string:
		return len(s)
	case []Directorate:
		return len(s)
	case []Language:
		return len(s)
	case []NEPStage:
		return len(s)
	case []Scheme:
		return len(s)
	default:
		return 1
	}
}

// Checksum is the deterministic SHA-256 over the item id + canonical JSON of its payload (the per-seed
// checksum recorded in the manifest, SEED RULE / VERIFICATION).
func Checksum(it Item) string {
	h := sha256.New()
	h.Write([]byte(it.ID))
	h.Write([]byte{0})
	if it.Payload != nil {
		b, _ := json.Marshal(it.Payload())
		h.Write(b)
	}
	return hex.EncodeToString(h.Sum(nil))
}

// ── Signed manifest (every seed has a checksum; the manifest is signed by the authority) ──

// ManifestEntry is one seed's checksum line.
type ManifestEntry struct {
	ID, Phase, Checksum string
}

// Manifest is the signed seed manifest (seed-manifest.yaml).
type Manifest struct {
	Version   string
	SignedBy  string
	Entries   []ManifestEntry
	Signature []byte
	PubKey    ed25519.PublicKey
}

func canonical(version, signedBy string, entries []ManifestEntry) []byte {
	es := append([]ManifestEntry{}, entries...)
	sort.Slice(es, func(i, j int) bool { return es[i].ID < es[j].ID })
	b, _ := json.Marshal(struct {
		V, S string
		E    []ManifestEntry
	}{version, signedBy, es})
	return b
}

// BuildManifest computes each seed's checksum and signs the manifest with the authority key.
func BuildManifest(items []Item, version, signedBy string, priv ed25519.PrivateKey) Manifest {
	entries := make([]ManifestEntry, len(items))
	for i, it := range items {
		entries[i] = ManifestEntry{ID: it.ID, Phase: it.Phase, Checksum: Checksum(it)}
	}
	sig := ed25519.Sign(priv, canonical(version, signedBy, entries))
	return Manifest{Version: version, SignedBy: signedBy, Entries: entries, Signature: sig, PubKey: priv.Public().(ed25519.PublicKey)}
}

// Verify checks the authority signature over the manifest.
func (m Manifest) Verify() bool {
	if len(m.PubKey) != ed25519.PublicKeySize {
		return false
	}
	return ed25519.Verify(m.PubKey, canonical(m.Version, m.SignedBy, m.Entries), m.Signature)
}

func (m Manifest) entry(id string) (ManifestEntry, bool) {
	for _, e := range m.Entries {
		if e.ID == id {
			return e, true
		}
	}
	return ManifestEntry{}, false
}

// ── Loader (idempotent, dependency-ordered, rollback, lineage, synthetic isolation) ──

// LoadedSeed is the lineage record for a loaded seed (every record knows where it came from, when, amendments).
type LoadedSeed struct {
	ID, Phase, Source, Steward, Version, Checksum, LoadedAt string
	Records                                                 int
	AmendedBy                                               []string
}

// Report is the outcome of a load.
type Report struct {
	Order    []string // the dependency-resolved load order
	Loaded   []string
	Skipped  []string          // idempotent — already loaded at this version
	Rejected map[string]string // id → reason
	OK       bool
}

// Loader loads seeds into an environment (production or non-production).
type Loader struct {
	production bool
	mu         sync.Mutex
	loaded     map[string]LoadedSeed
	now        func() string
}

// NewLoader builds a loader; production=true environments reject synthetic seed (C.7 egress guard).
func NewLoader(production bool) *Loader {
	return &Loader{production: production, loaded: map[string]LoadedSeed{}, now: func() string { return time.Now().UTC().Format(time.RFC3339Nano) }}
}

// order resolves a dependency-respecting order (stable: input order, deferring any item whose deps are not
// yet placed). Returns an error on an unsatisfiable cycle/missing dep.
func order(items []Item) ([]Item, error) {
	byID := map[string]Item{}
	for _, it := range items {
		byID[it.ID] = it
	}
	placed := map[string]bool{}
	var out []Item
	for progress := true; progress && len(out) < len(items); {
		progress = false
		for _, it := range items {
			if placed[it.ID] {
				continue
			}
			ready := true
			for _, d := range it.Deps {
				if _, known := byID[d]; known && !placed[d] {
					ready = false
					break
				}
			}
			if ready {
				out = append(out, it)
				placed[it.ID] = true
				progress = true
			}
		}
	}
	if len(out) != len(items) {
		return nil, errors.New("seed: unsatisfiable dependency order (cycle or missing dep)")
	}
	return out, nil
}

// Load loads the inventory under the SEED RULE: verify the signed manifest, then load in dependency order —
// rejecting synthetic-in-production, checksum mismatches, unmet deps, and items absent from the manifest;
// skipping seeds already loaded at this version (idempotent). Every load records lineage.
func (l *Loader) Load(items []Item, m Manifest) Report {
	rep := Report{Rejected: map[string]string{}}
	if !m.Verify() {
		rep.OK = false
		rep.Rejected["*manifest"] = "manifest signature invalid"
		return rep
	}
	ordered, err := order(items)
	if err != nil {
		rep.OK = false
		rep.Rejected["*order"] = err.Error()
		return rep
	}

	l.mu.Lock()
	defer l.mu.Unlock()
	rep.OK = true
	for _, it := range ordered {
		rep.Order = append(rep.Order, it.ID)

		if it.Synthetic && l.production {
			rep.Rejected[it.ID] = "synthetic seed refused in a production environment (C.7)"
			rep.OK = false
			continue
		}
		me, ok := m.entry(it.ID)
		if !ok {
			rep.Rejected[it.ID] = "not present in the signed manifest"
			rep.OK = false
			continue
		}
		if Checksum(it) != me.Checksum {
			rep.Rejected[it.ID] = "checksum mismatch vs manifest (tamper)"
			rep.OK = false
			continue
		}
		// dependency must already be loaded
		missing := ""
		for _, d := range it.Deps {
			if _, done := l.loaded[d]; !done {
				missing = d
				break
			}
		}
		if missing != "" {
			rep.Rejected[it.ID] = "unmet dependency " + missing
			rep.OK = false
			continue
		}
		// idempotent: already loaded at this version → skip
		if prev, done := l.loaded[it.ID]; done && prev.Version == m.Version {
			rep.Skipped = append(rep.Skipped, it.ID)
			continue
		}
		l.loaded[it.ID] = LoadedSeed{
			ID: it.ID, Phase: it.Phase, Source: it.Source, Steward: it.Steward,
			Version: m.Version, Checksum: me.Checksum, LoadedAt: l.now(), Records: it.records(),
		}
		rep.Loaded = append(rep.Loaded, it.ID)
	}
	return rep
}

// Amend records a subsequent authorised update to a loaded seed (lineage preservation).
func (l *Loader) Amend(id, by string) bool {
	l.mu.Lock()
	defer l.mu.Unlock()
	s, ok := l.loaded[id]
	if !ok {
		return false
	}
	s.AmendedBy = append(s.AmendedBy, by)
	l.loaded[id] = s
	return true
}

// Rollback removes every seed loaded at a version (rollback via seed-version tags); returns the count removed.
func (l *Loader) Rollback(version string) int {
	l.mu.Lock()
	defer l.mu.Unlock()
	n := 0
	for id, s := range l.loaded {
		if s.Version == version {
			delete(l.loaded, id)
			n++
		}
	}
	return n
}

// Lineage returns the loaded-seed record for an id.
func (l *Loader) Lineage(id string) (LoadedSeed, bool) {
	l.mu.Lock()
	defer l.mu.Unlock()
	s, ok := l.loaded[id]
	return s, ok
}

// Loaded returns the ids of all loaded seeds.
func (l *Loader) Loaded() []string {
	l.mu.Lock()
	defer l.mu.Unlock()
	var ids []string
	for id := range l.loaded {
		ids = append(ids, id)
	}
	sort.Strings(ids)
	return ids
}

// TotalRecords sums the loaded record counts.
func (l *Loader) TotalRecords() int {
	l.mu.Lock()
	defer l.mu.Unlock()
	n := 0
	for _, s := range l.loaded {
		n += s.Records
	}
	return n
}

// Checksums renders the deterministic, content-addressed checksum manifest (no signature — the authority
// applies the signature at load time per the SEED RULE). This is the committed `seed-manifest.yaml` body.
func Checksums(items []Item) string {
	var b strings.Builder
	b.WriteString("# seed-manifest.yaml — DAT-TN-001 seed inventory (content checksums; signed by the authority at load)\n")
	b.WriteString("seeds:\n")
	es := append([]Item{}, items...)
	sort.Slice(es, func(i, j int) bool { return es[i].Phase < es[j].Phase })
	for _, it := range es {
		gated := ""
		if it.Gated != "" {
			gated = "\n    gated: " + it.Gated
		}
		b.WriteString("  - id: " + it.ID + "\n    phase: " + it.Phase + "\n    category: " + string(it.Category) +
			"\n    steward: " + it.Steward + "\n    pii_class: " + itoaPII(it.PII) + "\n    checksum: " + Checksum(it) + gated + "\n")
	}
	return b.String()
}

func itoaPII(c PIIClass) string { return string(rune('0' + int(c))) }

// ManifestYAML renders a signed seed-manifest in a stable, human-reviewable form (the seed-manifest.yaml).
func (m Manifest) ManifestYAML() string {
	var b strings.Builder
	b.WriteString("# seed-manifest.yaml — DAT-TN-001 (signed; do not edit by hand)\n")
	b.WriteString("version: " + m.Version + "\n")
	b.WriteString("signed_by: " + m.SignedBy + "\n")
	b.WriteString("signature: " + hex.EncodeToString(m.Signature) + "\n")
	b.WriteString("public_key: " + hex.EncodeToString(m.PubKey) + "\n")
	b.WriteString("seeds:\n")
	es := append([]ManifestEntry{}, m.Entries...)
	sort.Slice(es, func(i, j int) bool { return es[i].Phase < es[j].Phase })
	for _, e := range es {
		b.WriteString("  - id: " + e.ID + "\n    phase: " + e.Phase + "\n    checksum: " + e.Checksum + "\n")
	}
	return b.String()
}
