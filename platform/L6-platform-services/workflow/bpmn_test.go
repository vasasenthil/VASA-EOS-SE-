package workflow

import (
	"encoding/xml"
	"strings"
	"testing"
)

func TestToBPMNWellFormed(t *testing.T) {
	d := Definition{
		Name: "scheme-sanction",
		Steps: []Step{
			{Name: "G3 District Officer", ApproverRole: "DEO", RequiredScope: "scheme.recommend"},
			{Name: "G5 Director", ApproverRole: "DIRECTOR", RequiredScope: "scheme.approve"},
			{Name: "G7 Secretary", ApproverRole: "SECRETARY", RequiredScope: "fund.release"},
		},
	}
	xmlStr, err := ToBPMN(d)
	if err != nil {
		t.Fatal(err)
	}
	// well-formed XML
	if err := xml.Unmarshal([]byte(xmlStr), new(any)); err != nil {
		t.Fatalf("BPMN is not well-formed XML: %v", err)
	}
	// one userTask per step
	if n := strings.Count(xmlStr, "<bpmn:userTask"); n != 3 {
		t.Fatalf("expected 3 userTasks, got %d", n)
	}
	// start + end events + the process id
	for _, want := range []string{"bpmn:startEvent", "bpmn:endEvent", `id="Process_scheme_sanction"`, `vasa:approverRole="DEO"`} {
		if !strings.Contains(xmlStr, want) {
			t.Fatalf("BPMN missing %q", want)
		}
	}
	// sequence flows chain start → 3 tasks → end = 4 flows
	if n := strings.Count(xmlStr, "<bpmn:sequenceFlow"); n != 4 {
		t.Fatalf("expected 4 sequence flows, got %d", n)
	}
}

func TestToBPMNEscapesAndValidates(t *testing.T) {
	if _, err := ToBPMN(Definition{Name: "x"}); err == nil {
		t.Fatal("a definition with no steps must error")
	}
	// special chars are escaped → still well-formed
	x, err := ToBPMN(Definition{Name: "a & b", Steps: []Step{{Name: "Review <x>", ApproverRole: "R"}}})
	if err != nil {
		t.Fatal(err)
	}
	if err := xml.Unmarshal([]byte(x), new(any)); err != nil {
		t.Fatalf("escaped BPMN not well-formed: %v", err)
	}
}
