module github.com/vasa-eos-se-tn/platform/civic

go 1.22

require github.com/vasa-eos-se-tn/platform/population v0.0.0

require github.com/vasa-eos-se-tn/platform/seed v0.0.0 // indirect

replace github.com/vasa-eos-se-tn/platform/population => ../../L3-data-fabric/population

replace github.com/vasa-eos-se-tn/platform/seed => ../../L3-data-fabric/seed
