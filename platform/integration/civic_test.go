package integration

import (
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/vasa-eos-se-tn/platform/adapters"
	"github.com/vasa-eos-se-tn/platform/pep"
)

func TestFetchLearnerCredentials(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprint(w, `[{"doc_uri":"dl://1","doc_type":"MarkSheet","issued_by":"DGE-TN","issued_on":"2026-06-01"}]`)
	}))
	defer srv.Close()
	p := newPlatform(t)
	docs, err := p.FetchLearnerCredentials(context.Background(), adapters.NewDigiLockerClient(srv.URL, nil), "APAAR-1")
	if err != nil {
		t.Fatal(err)
	}
	if len(docs) != 1 || docs[0].Type != "MarkSheet" {
		t.Fatalf("DigiLocker fetch wrong: %+v", docs)
	}
}

func TestFetchLearningResource(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprint(w, `{"identifier":"do_1","name":"Fractions","subject":"Math","gradeLevel":4,"artifactUrl":"https://diksha/do_1"}`)
	}))
	defer srv.Close()
	p := newPlatform(t)
	res, err := p.FetchLearningResource(context.Background(), adapters.NewDIKSHAClient(srv.URL, nil), "do_1")
	if err != nil {
		t.Fatal(err)
	}
	if res.Title != "Fractions" || res.Grade != 4 {
		t.Fatalf("DIKSHA fetch wrong: %+v", res)
	}
}

func TestRTIExemptDenied(t *testing.T) {
	p := newPlatform(t)
	dec := p.RTIDisclosure(context.Background(), "PIO", "FILE-1", "personal-info", false)
	if dec.Effect != pep.Deny || !containsStr(dec.Reasons, "RTI-S8-EXEMPT") {
		t.Fatalf("exempt RTI info must be denied: %+v", dec)
	}
}

func TestRTIThirdPartyRequiresReview(t *testing.T) {
	p := newPlatform(t)
	dec := p.RTIDisclosure(context.Background(), "PIO", "FILE-2", "", true)
	if dec.Effect != pep.RequireApproval || !containsStr(dec.Reasons, "RTI-S11-THIRD-PARTY") {
		t.Fatalf("third-party RTI info must require PIO review: %+v", dec)
	}
}

func TestRTIPublicPermitted(t *testing.T) {
	p := newPlatform(t)
	dec := p.RTIDisclosure(context.Background(), "PIO", "FILE-3", "public", false)
	if dec.Effect != pep.Permit {
		t.Fatalf("public RTI info should be disclosable: %+v", dec)
	}
}
