module github.com/vasa-eos-se-tn/platform/credentials

go 1.22

require github.com/vasa-eos-se-tn/platform/notary v0.0.0

// Monorepo-local module (no external registry; stdlib-only). CI builds the whole tree together.
replace github.com/vasa-eos-se-tn/platform/notary => ../notary
