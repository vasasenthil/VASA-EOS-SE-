module github.com/vasa-eos-se-tn/platform/catalogue

go 1.22

require (
	github.com/vasa-eos-se-tn/platform/quality v0.0.0
	github.com/vasa-eos-se-tn/platform/seed v0.0.0
)

replace github.com/vasa-eos-se-tn/platform/seed => ../seed

replace github.com/vasa-eos-se-tn/platform/quality => ../quality
