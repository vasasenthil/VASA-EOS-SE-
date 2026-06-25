package integration

import (
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/vasa-eos-se-tn/platform/adapters"
)

func TestTutorCitesDikshaContent(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprint(w, `{"identifier":"do_frac","name":"Fractions for Class 4","subject":"Math","gradeLevel":4,"artifactUrl":"https://diksha/do_frac"}`)
	}))
	defer srv.Close()

	p := newPlatform(t)
	p.SetContentResolver(NewDikshaContentResolver(
		adapters.NewDIKSHAClient(srv.URL, nil),
		map[string]string{"frac": "do_frac"},
	))

	res, err := p.AskTutor(context.Background(), TutorRequest{
		Tenant: "TN/Chennai", Question: "Explain fractions.", AgeAppropriate: true,
		Mastered: map[string]bool{"div": true, "place": true}, Target: "frac",
	})
	if err != nil {
		t.Fatal(err)
	}
	if res.ContentTitle != "Fractions for Class 4" || res.ContentURL == "" {
		t.Fatalf("the tutor should cite the DIKSHA resource for the target: %+v", res)
	}
}

func TestTutorWithoutResolverStillServes(t *testing.T) {
	p := newPlatform(t) // no content resolver wired
	res, err := p.AskTutor(context.Background(), TutorRequest{
		Tenant: "TN/Chennai", Question: "Explain fractions.", AgeAppropriate: true,
		Mastered: map[string]bool{"div": true, "place": true}, Target: "frac",
	})
	if err != nil {
		t.Fatal(err)
	}
	if res.Stage != "served" || res.ContentTitle != "" {
		t.Fatalf("without a resolver the tutor serves with no citation: %+v", res)
	}
}

func TestTutorContentGracefulOnUpstreamFailure(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		http.Error(w, "not found", http.StatusNotFound)
	}))
	defer srv.Close()
	p := newPlatform(t)
	p.SetContentResolver(NewDikshaContentResolver(adapters.NewDIKSHAClient(srv.URL, nil), map[string]string{"frac": "missing"}))
	res, err := p.AskTutor(context.Background(), TutorRequest{
		Tenant: "TN/Chennai", Question: "Explain fractions.", AgeAppropriate: true, Target: "frac",
		Mastered: map[string]bool{"div": true, "place": true},
	})
	if err != nil {
		t.Fatal(err)
	}
	// a content-fetch failure must not break the tutor — it just omits the citation
	if res.Stage != "served" || res.ContentTitle != "" {
		t.Fatalf("a failed content fetch must degrade gracefully: %+v", res)
	}
}
