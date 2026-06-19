package adapters

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func noSleepDL(url string) *DigiLockerClient {
	c := NewDigiLockerClient(url, &http.Client{Timeout: 2 * time.Second})
	c.sleep = func(time.Duration) {}
	return c
}
func noSleepDK(url string) *DIKSHAClient {
	c := NewDIKSHAClient(url, &http.Client{Timeout: 2 * time.Second})
	c.sleep = func(time.Duration) {}
	return c
}

func TestDigiLockerListAndTransform(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprint(w, `[{"doc_uri":"dl://1","doc_type":"MarkSheet","issued_by":"DGE-TN","issued_on":"2026-06-01"},
		                {"doc_uri":"dl://2","doc_type":"TransferCertificate","issued_by":"DGE-TN","issued_on":"2026-06-02"}]`)
	}))
	defer srv.Close()
	docs, err := noSleepDL(srv.URL).GetCredentials(context.Background(), "APAAR-1")
	if err != nil {
		t.Fatal(err)
	}
	if len(docs) != 2 || docs[0].Type != "MarkSheet" || docs[0].Issuer != "DGE-TN" {
		t.Fatalf("DigiLocker DTO list not transformed: %+v", docs)
	}
}

func TestDigiLockerNoRetryOn404(t *testing.T) {
	var calls int
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		calls++
		http.Error(w, "no such holder", http.StatusNotFound)
	}))
	defer srv.Close()
	_, err := noSleepDL(srv.URL).GetCredentials(context.Background(), "missing")
	var he *HTTPError
	if !errors.As(err, &he) || he.Status != 404 {
		t.Fatalf("expected a 404 HTTPError, got %v", err)
	}
	if calls != 1 {
		t.Fatalf("a 404 must not be retried; calls=%d", calls)
	}
}

func TestDIKSHAGetAndTransform(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprint(w, `{"identifier":"do_123","name":"Fractions","subject":"Math","gradeLevel":4,"artifactUrl":"https://diksha/do_123"}`)
	}))
	defer srv.Close()
	res, err := noSleepDK(srv.URL).GetResource(context.Background(), "do_123")
	if err != nil {
		t.Fatal(err)
	}
	if res.Title != "Fractions" || res.Grade != 4 || res.URL == "" {
		t.Fatalf("DIKSHA DTO not transformed: %+v", res)
	}
}
