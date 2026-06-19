package workflow

import (
	"fmt"
	"strings"
)

// ToBPMN exports a workflow Definition as BPMN 2.0 XML (CC-SPEC-001 §6; the "Spec Engineering" discipline —
// the multi-tier approval flow expressed as a declarative, tool-interchangeable BPMN process). Each approval
// step becomes a userTask gated to its approver role; a start event, end event, and the sequence flows that
// chain them are emitted. The XML is well-formed and importable into a BPMN engine/editor.
func ToBPMN(d Definition) (string, error) {
	if err := d.Validate(); err != nil {
		return "", err
	}
	procID := "Process_" + sanitize(d.Name)
	var b strings.Builder
	b.WriteString(`<?xml version="1.0" encoding="UTF-8"?>` + "\n")
	b.WriteString(`<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" ` +
		`xmlns:vasa="http://vasa-eos.tn.gov.in/bpmn/ext" ` +
		`id="Definitions_` + sanitize(d.Name) + `" targetNamespace="http://vasa-eos.tn.gov.in/bpmn">` + "\n")
	fmt.Fprintf(&b, "  <bpmn:process id=%q name=%q isExecutable=\"true\">\n", procID, xmlEscape(d.Name))

	// node ids
	start := "StartEvent_1"
	end := "EndEvent_1"
	taskID := func(i int) string { return fmt.Sprintf("Task_%d", i+1) }

	b.WriteString(fmt.Sprintf("    <bpmn:startEvent id=%q name=\"Submitted\"/>\n", start))
	for i, s := range d.Steps {
		fmt.Fprintf(&b, "    <bpmn:userTask id=%q name=%q vasa:approverRole=%q vasa:requiredScope=%q/>\n",
			taskID(i), xmlEscape(s.Name), xmlEscape(s.ApproverRole), xmlEscape(s.RequiredScope))
	}
	b.WriteString(fmt.Sprintf("    <bpmn:endEvent id=%q name=\"Approved\"/>\n", end))

	// sequence flows: start → task0 → task1 → … → end
	prev := start
	for i := range d.Steps {
		cur := taskID(i)
		fmt.Fprintf(&b, "    <bpmn:sequenceFlow id=\"Flow_%d\" sourceRef=%q targetRef=%q/>\n", i, prev, cur)
		prev = cur
	}
	fmt.Fprintf(&b, "    <bpmn:sequenceFlow id=\"Flow_end\" sourceRef=%q targetRef=%q/>\n", prev, end)

	b.WriteString("  </bpmn:process>\n")
	b.WriteString("</bpmn:definitions>\n")
	return b.String(), nil
}

func sanitize(s string) string {
	var b strings.Builder
	for _, r := range s {
		if (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9') {
			b.WriteRune(r)
		} else {
			b.WriteRune('_')
		}
	}
	return b.String()
}

func xmlEscape(s string) string {
	r := strings.NewReplacer("&", "&amp;", "<", "&lt;", ">", "&gt;", `"`, "&quot;")
	return r.Replace(s)
}
