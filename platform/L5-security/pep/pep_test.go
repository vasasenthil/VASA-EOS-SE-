package pep

import (
	"context"
	"errors"
	"reflect"
	"testing"
)

// fakeDecider returns canned results so PEP semantics can be tested without a policy engine.
type fakeDecider struct {
	effect    Effect
	governing []map[string]any
	err       error
	gotInput  map[string]any
}

func (f *fakeDecider) Evaluate(_ context.Context, in map[string]any) (Effect, []map[string]any, error) {
	f.gotInput = in
	return f.effect, f.governing, f.err
}

func TestFailClosedOnDeciderError(t *testing.T) {
	p, _ := New("app", &fakeDecider{err: errors.New("opa unreachable")})
	d := p.Authorize(context.Background(), Request{Subject: Subject{Role: "TEACHER"}, Action: "marks.write"})
	if d.Effect != Deny {
		t.Fatalf("a decider error must fail closed to deny, got %q", d.Effect)
	}
	if d.Allowed() {
		t.Fatal("Allowed() must be false on fail-closed")
	}
	if d.Err == nil {
		t.Fatal("fail-closed decision should carry the error")
	}
}

func TestFailClosedOnUnknownEffect(t *testing.T) {
	p, _ := New("kong", &fakeDecider{effect: "maybe"})
	d := p.Authorize(context.Background(), Request{Action: "content.read"})
	if d.Effect != Deny {
		t.Fatalf("an unrecognised effect must be denied, got %q", d.Effect)
	}
}

func TestMissingActionDenied(t *testing.T) {
	p, _ := New("db", &fakeDecider{effect: Permit})
	d := p.Authorize(context.Background(), Request{Subject: Subject{Role: "STUDENT"}})
	if d.Effect != Deny {
		t.Fatal("a request with no action must be denied without consulting the PDP")
	}
}

func TestPermitAndReasonsExtracted(t *testing.T) {
	gov := []map[string]any{{"rule": "RTE-EWS-QUOTA", "reviewer_tier": "T3"}}
	p, _ := New("app", &fakeDecider{effect: RequireApproval, governing: gov})
	d := p.Authorize(context.Background(), Request{Subject: Subject{Role: "DEO"}, Action: "admission.reject"})
	if !d.NeedsApproval() {
		t.Fatalf("expected require-approval, got %q", d.Effect)
	}
	if !reflect.DeepEqual(d.Reasons, []string{"RTE-EWS-QUOTA"}) {
		t.Fatalf("reasons not extracted from governing: %v", d.Reasons)
	}
}

func TestBuildInputFlattensAttributes(t *testing.T) {
	fd := &fakeDecider{effect: Permit}
	p, _ := New("app", fd)
	p.Authorize(context.Background(), Request{
		Subject:  Subject{Role: "BEO", ID: "u1", Attributes: map[string]any{"district": "Chennai"}},
		Action:   "admission.reject",
		Resource: Resource{Type: "application", Attributes: map[string]any{"category": "EWS", "quotaFull": false, "age": 7}},
	})
	subj := fd.gotInput["subject"].(map[string]any)
	if subj["role"] != "BEO" || subj["district"] != "Chennai" {
		t.Fatalf("subject not built/flattened correctly: %v", subj)
	}
	res := fd.gotInput["resource"].(map[string]any)
	if res["category"] != "EWS" || res["age"] != 7 || res["type"] != "application" {
		t.Fatalf("resource not built/flattened correctly: %v", res)
	}
	if fd.gotInput["action"] != "admission.reject" {
		t.Fatalf("action not set: %v", fd.gotInput["action"])
	}
}

func TestNewValidates(t *testing.T) {
	if _, err := New("", &fakeDecider{}); err == nil {
		t.Fatal("empty name must error")
	}
	if _, err := New("app", nil); err == nil {
		t.Fatal("nil decider must error")
	}
}
