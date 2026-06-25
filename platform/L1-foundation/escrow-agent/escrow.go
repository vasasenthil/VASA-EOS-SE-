// Package escrow implements the VASA-EOS(SE) TN source-code escrow agent (CC-SPEC-001 §2.1, §4 L1, §27).
//
// Sovereignty requires that the State can reconstruct and operate the platform without the vendor. The
// escrow agent produces a deterministic, verifiable MANIFEST of an escrow package: every file's path and
// SHA-256, a Merkle-style root over the sorted entries, plus the metadata the State needs to rebuild
// (build instructions reference, dependency-snapshot reference, root-key escrow reference). The manifest
// is signed by the State authority at deposit time. Deterministic + dependency-free (stdlib only): the
// same tree always yields the same root, so a deposit is independently verifiable by the auditor (G7).
package escrow

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"io/fs"
	"path/filepath"
	"sort"
	"strings"
)

// Entry is one file in the escrow package.
type Entry struct {
	Path   string `json:"path"`
	SHA256 string `json:"sha256"`
	Size   int64  `json:"size"`
}

// Manifest is the verifiable record of an escrow deposit.
type Manifest struct {
	Package         string  `json:"package"`
	Entries         []Entry `json:"entries"`
	Root            string  `json:"root"`            // Merkle-style root over sorted entries
	BuildRef        string  `json:"build_ref"`       // ref to build instructions (e.g. docs/DEPLOYMENT.md@sha)
	DependencyRef   string  `json:"dependency_ref"`  // ref to the pinned dependency snapshot (e.g. SBOM digest)
	RootKeyEscrowID string  `json:"root_key_escrow"` // ref to the cryptographic root key held in escrow (HSM)
}

// hashFile returns the hex SHA-256 of a file's contents.
func hashFile(fsys fs.FS, path string) (string, int64, error) {
	b, err := fs.ReadFile(fsys, path)
	if err != nil {
		return "", 0, err
	}
	sum := sha256.Sum256(b)
	return hex.EncodeToString(sum[:]), int64(len(b)), nil
}

// Build walks fsys (rooted at "."), hashing every regular file, and produces a deterministic manifest.
// `skip` paths (prefixes) are excluded (e.g. node_modules, .git, build output).
func Build(fsys fs.FS, pkg string, meta Manifest, skip []string) (Manifest, error) {
	var entries []Entry
	err := fs.WalkDir(fsys, ".", func(p string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if d.IsDir() {
			return nil
		}
		for _, s := range skip {
			if strings.HasPrefix(p, s) {
				return nil
			}
		}
		h, sz, err := hashFile(fsys, p)
		if err != nil {
			return err
		}
		entries = append(entries, Entry{Path: filepath.ToSlash(p), SHA256: h, Size: sz})
		return nil
	})
	if err != nil {
		return Manifest{}, err
	}
	sort.Slice(entries, func(i, j int) bool { return entries[i].Path < entries[j].Path })
	meta.Package = pkg
	meta.Entries = entries
	meta.Root = root(entries)
	return meta, nil
}

// root computes a deterministic Merkle-style root: hash of the sorted "path:sha256" lines.
func root(entries []Entry) string {
	h := sha256.New()
	for _, e := range entries {
		h.Write([]byte(e.Path))
		h.Write([]byte{0})
		h.Write([]byte(e.SHA256))
		h.Write([]byte{'\n'})
	}
	return hex.EncodeToString(h.Sum(nil))
}

// Verify recomputes the root over a manifest's entries and confirms it matches (tamper-evidence).
func Verify(m Manifest) bool {
	return root(m.Entries) == m.Root
}

// JSON returns the canonical JSON of the manifest (what the State authority signs).
func (m Manifest) JSON() ([]byte, error) {
	return json.MarshalIndent(m, "", "  ")
}
