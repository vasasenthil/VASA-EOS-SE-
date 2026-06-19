package escrow

import (
	"testing"
	"testing/fstest"
)

func tree() fstest.MapFS {
	return fstest.MapFS{
		"src/main.go":    {Data: []byte("package main\nfunc main(){}\n")},
		"src/lib.go":     {Data: []byte("package main\nvar x = 1\n")},
		"README.md":      {Data: []byte("# vasa-eos\n")},
		"node_modules/x": {Data: []byte("junk")}, // must be skipped
	}
}

func TestBuildIsDeterministic(t *testing.T) {
	m1, err := Build(tree(), "vasa-eos-se-tn", Manifest{BuildRef: "docs/DEPLOYMENT.md", RootKeyEscrowID: "hsm:key-1"}, []string{"node_modules"})
	if err != nil {
		t.Fatal(err)
	}
	m2, _ := Build(tree(), "vasa-eos-se-tn", Manifest{BuildRef: "docs/DEPLOYMENT.md", RootKeyEscrowID: "hsm:key-1"}, []string{"node_modules"})
	if m1.Root != m2.Root {
		t.Fatalf("root not deterministic: %s vs %s", m1.Root, m2.Root)
	}
	if len(m1.Entries) != 3 { // node_modules skipped
		t.Fatalf("expected 3 entries (node_modules skipped), got %d", len(m1.Entries))
	}
	if !Verify(m1) {
		t.Fatal("manifest should verify against its own root")
	}
}

func TestChangedFileChangesRoot(t *testing.T) {
	base, _ := Build(tree(), "p", Manifest{}, []string{"node_modules"})
	tampered := tree()
	tampered["src/main.go"] = &fstest.MapFile{Data: []byte("package main\nfunc main(){println(1)}\n")}
	changed, _ := Build(tampered, "p", Manifest{}, []string{"node_modules"})
	if base.Root == changed.Root {
		t.Fatal("a changed file must change the escrow root")
	}
}

func TestVerifyDetectsTamper(t *testing.T) {
	m, _ := Build(tree(), "p", Manifest{}, []string{"node_modules"})
	// tamper with a recorded hash without recomputing the root
	m.Entries[0].SHA256 = "0000000000000000000000000000000000000000000000000000000000000000"
	if Verify(m) {
		t.Fatal("Verify must fail when an entry hash is altered")
	}
}

func TestSkipExcludesPrefixes(t *testing.T) {
	m, _ := Build(tree(), "p", Manifest{}, []string{"node_modules", "src/lib.go"})
	for _, e := range m.Entries {
		if e.Path == "src/lib.go" || e.Path == "node_modules/x" {
			t.Fatalf("skipped path present: %s", e.Path)
		}
	}
	if len(m.Entries) != 2 {
		t.Fatalf("expected 2 entries, got %d", len(m.Entries))
	}
}
