module github.com/vasa-eos-se-tn/platform/tenancy

go 1.22

require (
	github.com/vasa-eos-se-tn/platform/population v0.0.0
	github.com/vasa-eos-se-tn/platform/seed v0.0.0
)

replace github.com/vasa-eos-se-tn/platform/seed => ../../L3-data-fabric/seed

replace github.com/vasa-eos-se-tn/platform/population => ../../L3-data-fabric/population
