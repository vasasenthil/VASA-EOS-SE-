package integration

import "testing"

func TestSchoolProfileAssemblesAcrossLayers(t *testing.T) {
	p := newPlatform(t)
	udise := p.SchoolsGovernedBy("TN-DIST-Chennai").Sample[0]

	prof := p.SchoolProfile(udise)
	if !prof.Found || prof.UDISE != udise {
		t.Fatalf("the school must be found: %+v", prof)
	}
	// full taxonomy classification is present.
	s := prof.School
	if s.Management == "" || s.Level == "" || s.Medium == "" || s.Gender == "" || s.Residential == "" {
		t.Fatalf("classification incomplete: %+v", s)
	}
	// governance chain runs from the sovereign down to this school, through DSE.
	if prof.District != "Chennai" || prof.Directorate == "" || prof.GovernancePath == "" {
		t.Fatalf("governance not resolved: district=%q directorate=%q path=%q", prof.District, prof.Directorate, prof.GovernancePath)
	}
	// the compliance snapshot is consistent (compliant iff no findings).
	if prof.Compliant != (len(prof.Compliance) == 0) {
		t.Fatalf("compliant flag inconsistent with findings: %+v", prof)
	}
}

func TestSchoolProfileUnknown(t *testing.T) {
	p := newPlatform(t)
	if prof := p.SchoolProfile("00000000000"); prof.Found {
		t.Fatalf("an unknown UDISE must not be found: %+v", prof)
	}
}

func TestSchoolProfileDevicesAndAudit(t *testing.T) {
	p := newPlatform(t)
	// the demo IoT fleet anchors devices to the first real estate school — its profile must surface them.
	first := tree().Schools[0].UDISE
	prof := p.SchoolProfile(first)
	if !prof.Found {
		t.Fatalf("the first estate school %s must be found", first)
	}
	if len(prof.Devices) == 0 {
		t.Fatalf("the demo school should surface its IoT devices, got %d", len(prof.Devices))
	}
}
