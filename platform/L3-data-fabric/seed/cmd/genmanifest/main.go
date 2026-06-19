// Command genmanifest emits the committed seed-manifest.yaml (content checksums for the DAT-TN-001 seed
// inventory). Run from the seed module dir: `go run ./cmd/genmanifest > seed-manifest.yaml`.
package main

import (
	"fmt"

	"github.com/vasa-eos-se-tn/platform/seed"
)

func main() {
	items := append(seed.Inventory(), seed.SyntheticInventory()...)
	fmt.Print(seed.Checksums(items))
}
