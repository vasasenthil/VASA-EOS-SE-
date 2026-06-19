package seed

import (
	"crypto/ed25519"
	"testing"
)

func authority(t *testing.T) ed25519.PrivateKey {
	t.Helper()
	_, priv, err := ed25519.GenerateKey(nil)
	if err != nil {
		t.Fatal(err)
	}
	return priv
}

func TestReferenceDataMatchesBrief(t *testing.T) {
	if len(Districts) != 38 {
		t.Fatalf("TN has 38 districts, got %d", len(Districts))
	}
	if len(Directorates) != 7 {
		t.Fatalf("7 directorates, got %d", len(Directorates))
	}
	if len(Languages) != 22 || !Languages[0].Primary || Languages[0].Name != "Tamil" {
		t.Fatalf("22 languages, Tamil first/primary; got %d first=%+v", len(Languages), Languages[0])
	}
	if len(RPwDCategories) != 21 {
		t.Fatalf("21 RPwD categories, got %d", len(RPwDCategories))
	}
	if Counts["schools"] != 69000 || Counts["blocks"] != 385 || Counts["clusters"] != 3800 {
		t.Fatalf("reference counts wrong: %v", Counts)
	}
}

func TestLoadDependencyOrderedAndIdempotent(t *testing.T) {
	priv := authority(t)
	items := Inventory()
	m := BuildManifest(items, "v1", "DSE", priv)
	l := NewLoader(true)

	rep := l.Load(items, m)
	if !rep.OK {
		t.Fatalf("clean signed seed should load: rejected=%v", rep.Rejected)
	}
	if len(rep.Loaded) != len(items) {
		t.Fatalf("expected all %d seeds loaded, got %d", len(items), len(rep.Loaded))
	}
	// dependency order: SEED-OFFICES must come after its deps
	pos := map[string]int{}
	for i, id := range rep.Order {
		pos[id] = i
	}
	if pos["SEED-OFFICES"] < pos["SEED-GEOGRAPHY"] || pos["SEED-OFFICES"] < pos["SEED-DIRECTORATES"] {
		t.Fatal("SEED-OFFICES must load after geography + directorates")
	}
	// idempotent re-run: everything skipped, nothing re-loaded
	rep2 := l.Load(items, m)
	if len(rep2.Loaded) != 0 || len(rep2.Skipped) != len(items) {
		t.Fatalf("a re-run must be idempotent: loaded=%d skipped=%d", len(rep2.Loaded), len(rep2.Skipped))
	}
}

func TestManifestSignatureRequired(t *testing.T) {
	items := Inventory()
	m := BuildManifest(items, "v1", "DSE", authority(t))
	m.Signature[0] ^= 0xFF // tamper
	rep := NewLoader(true).Load(items, m)
	if rep.OK || rep.Rejected["*manifest"] == "" {
		t.Fatalf("a tampered manifest signature must be rejected: %v", rep.Rejected)
	}
}

func TestChecksumMismatchRejected(t *testing.T) {
	priv := authority(t)
	items := Inventory()
	m := BuildManifest(items, "v1", "DSE", priv)
	// corrupt one manifest checksum
	for i := range m.Entries {
		if m.Entries[i].ID == "SEED-LANGUAGES" {
			m.Entries[i].Checksum = "deadbeef"
		}
	}
	// re-sign so the signature is valid but the checksum is wrong
	m2 := Manifest{Version: m.Version, SignedBy: m.SignedBy, Entries: m.Entries}
	m2.Signature = ed25519.Sign(priv, canonical(m2.Version, m2.SignedBy, m2.Entries))
	m2.PubKey = priv.Public().(ed25519.PublicKey)
	rep := NewLoader(true).Load(items, m2)
	if rep.Rejected["SEED-LANGUAGES"] == "" {
		t.Fatalf("a checksum mismatch must reject the seed: %v", rep.Rejected)
	}
}

func TestSyntheticNeverInProduction(t *testing.T) {
	priv := authority(t)
	all := append(Inventory(), SyntheticInventory()...)
	m := BuildManifest(all, "v1", "DSE", priv)

	// production loader rejects every synthetic seed (C.7 egress guard)
	repProd := NewLoader(true).Load(all, m)
	for _, syn := range SyntheticInventory() {
		if repProd.Rejected[syn.ID] == "" {
			t.Fatalf("synthetic seed %s must be rejected in production", syn.ID)
		}
	}
	// non-production loader accepts them
	repDev := NewLoader(false).Load(all, m)
	if s, ok := repDev.Rejected["SYN-STUDENTS"]; ok {
		t.Fatalf("synthetic seed should load in a non-production environment, got rejection %q", s)
	}
}

func TestRollbackAndLineage(t *testing.T) {
	priv := authority(t)
	items := Inventory()
	m := BuildManifest(items, "v1", "DSE", priv)
	l := NewLoader(true)
	l.Load(items, m)

	// lineage: a loaded seed knows its source + version + checksum
	ls, ok := l.Lineage("SEED-LANGUAGES")
	if !ok || ls.Version != "v1" || ls.Records != 22 || ls.Source == "" {
		t.Fatalf("lineage not recorded: %+v", ls)
	}
	// amend (a later authorised update) is tracked
	l.Amend("SEED-LANGUAGES", "GO-2026-Amendment-12")
	ls, _ = l.Lineage("SEED-LANGUAGES")
	if len(ls.AmendedBy) != 1 {
		t.Fatal("amendment must be recorded in lineage")
	}
	// rollback removes everything loaded at v1
	n := l.Rollback("v1")
	if n != len(items) || len(l.Loaded()) != 0 {
		t.Fatalf("rollback should remove all v1 seeds: removed=%d remaining=%d", n, len(l.Loaded()))
	}
}

func TestManifestYAMLRenders(t *testing.T) {
	m := BuildManifest(Inventory(), "v1", "DSE", authority(t))
	y := m.ManifestYAML()
	for _, want := range []string{"version: v1", "signed_by: DSE", "id: SEED-LANGUAGES", "checksum:"} {
		if !contains(y, want) {
			t.Fatalf("manifest yaml missing %q", want)
		}
	}
}

func contains(s, sub string) bool {
	return len(s) >= len(sub) && (func() bool {
		for i := 0; i+len(sub) <= len(s); i++ {
			if s[i:i+len(sub)] == sub {
				return true
			}
		}
		return false
	}())
}
