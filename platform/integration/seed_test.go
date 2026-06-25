package integration

import (
	"strings"
	"testing"
)

func TestPlatformLoadsSeedAtBoot(t *testing.T) {
	p := newPlatform(t)
	st := p.SeedStatus()
	if !st.OK {
		t.Fatalf("the platform must boot with the seed loaded (productive): %+v", st.Rejected)
	}
	if st.Loaded == 0 || st.Version != "v1" {
		t.Fatalf("seed should be loaded at v1: %+v", st)
	}
	// the dependency order put geography before offices
	pos := map[string]int{}
	for i, id := range st.Order {
		pos[id] = i
	}
	if pos["SEED-OFFICES"] < pos["SEED-GEOGRAPHY"] {
		t.Fatal("SEED-OFFICES must load after SEED-GEOGRAPHY")
	}
}

func TestSeedLineageAndManifest(t *testing.T) {
	p := newPlatform(t)
	ls, ok := p.SeedLineage("SEED-DISABILITIES")
	if !ok || ls.Records != 21 || ls.Version != "v1" {
		t.Fatalf("seed lineage for the 21 RPwD categories wrong: %+v", ls)
	}
	y := p.SeedManifestYAML()
	if !strings.Contains(y, "SEED-LANGUAGES") || !strings.Contains(y, "signed_by: DSE") {
		t.Fatalf("seed manifest yaml missing expected content")
	}
}

func TestSeedRejectsSyntheticInProduction(t *testing.T) {
	// the platform is a production environment → no synthetic seed should ever be loaded.
	p := newPlatform(t)
	if _, ok := p.SeedLineage("SYN-STUDENTS"); ok {
		t.Fatal("synthetic seed must never be loaded into the production platform")
	}
}
