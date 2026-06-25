package integration

import (
	"io/fs"

	escrow "github.com/vasa-eos-se-tn/platform/escrow-agent"
	"github.com/vasa-eos-se-tn/platform/loadmodel"
)

// EscrowManifest builds a deterministic, verifiable source-code-escrow manifest of a tree (L1 sovereignty,
// §27). The State can reconstruct and verify the platform without the vendor; the manifest is signed at
// deposit time and its root anchored to the notary. Default skips build/VCS noise.
func (p *Platform) EscrowManifest(fsys fs.FS, pkg, buildRef, depRef, rootKeyEscrow string) (escrow.Manifest, error) {
	return escrow.Build(fsys, pkg, escrow.Manifest{
		BuildRef:        buildRef,
		DependencyRef:   depRef,
		RootKeyEscrowID: rootKeyEscrow,
	}, []string{"node_modules", ".git", ".next", "dist", "build"})
}

// LoadScenarios returns the canonical §10.8 load-test suite the platform's scale is proven against on the rig
// (B-032): the 1-crore hour, the 2-crore surge, and the 72-hour soak.
func (p *Platform) LoadScenarios() []loadmodel.Scenario { return loadmodel.Suite() }
