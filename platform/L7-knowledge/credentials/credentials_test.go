package credentials

import (
	"crypto/ed25519"
	"testing"

	"github.com/vasa-eos-se-tn/platform/notary"
)

func issuerKey(t *testing.T) ed25519.PrivateKey {
	t.Helper()
	_, priv, err := ed25519.GenerateKey(nil)
	if err != nil {
		t.Fatal(err)
	}
	return priv
}

func sampleCred(id string) Credential {
	return Credential{
		ID: id, Type: "MarkSheet", Subject: "APAAR-0001", Issuer: "DGE-TamilNadu", IssuedAt: "2026-06-19",
		Claims: map[string]string{"grade": "10", "term": "annual", "result": "PASS"},
	}
}

func TestIssueAndVerifySignature(t *testing.T) {
	sc, err := Issue(sampleCred("C1"), issuerKey(t))
	if err != nil {
		t.Fatal(err)
	}
	if !sc.VerifySignature() {
		t.Fatal("a freshly issued credential must verify")
	}
}

func TestTamperBreaksSignature(t *testing.T) {
	sc, _ := Issue(sampleCred("C1"), issuerKey(t))
	sc.Credential.Claims["result"] = "FAIL" // tamper after signing
	if sc.VerifySignature() {
		t.Fatal("altering a claim must invalidate the signature")
	}
}

func TestWrongIssuerKeyFails(t *testing.T) {
	sc, _ := Issue(sampleCred("C1"), issuerKey(t))
	other, _, _ := ed25519.GenerateKey(nil)
	sc.PubKey = other // present a different issuer key
	if sc.VerifySignature() {
		t.Fatal("a signature must not verify under the wrong public key")
	}
}

func TestAnchorAndVerifyEndToEnd(t *testing.T) {
	priv := issuerKey(t)
	l := notary.New()
	var batch []SignedCredential
	for _, id := range []string{"C1", "C2", "C3"} {
		sc, _ := Issue(sampleCred(id), priv)
		batch = append(batch, sc)
	}
	_, anchored, err := AnchorBatch(l, batch)
	if err != nil {
		t.Fatal(err)
	}
	for _, ac := range anchored {
		ok, fail := Verify(ac)
		if !ok {
			t.Fatalf("anchored credential %s should verify; failures=%v", ac.Signed.Credential.ID, fail)
		}
	}
	if err := l.Verify(); err != nil {
		t.Fatalf("ledger should verify: %v", err)
	}
}

func TestVerifyDetectsUnanchoredCredential(t *testing.T) {
	priv := issuerKey(t)
	l := notary.New()
	sc1, _ := Issue(sampleCred("C1"), priv)
	_, anchored, _ := AnchorBatch(l, []SignedCredential{sc1})

	// take a valid proof but swap in a DIFFERENT (never-anchored) credential
	forged, _ := Issue(sampleCred("C-FORGED"), priv)
	ac := anchored[0]
	ac.Signed = forged
	ok, fail := Verify(ac)
	if ok || !contains(fail, "PROOF-NOT-FOR-CREDENTIAL") {
		t.Fatalf("a credential not matching the proof leaf must fail; ok=%v fail=%v", ok, fail)
	}
}

func TestVerifyDetectsBadSignature(t *testing.T) {
	priv := issuerKey(t)
	l := notary.New()
	sc, _ := Issue(sampleCred("C1"), priv)
	_, anchored, _ := AnchorBatch(l, []SignedCredential{sc})
	ac := anchored[0]
	ac.Signed.Signature = make([]byte, ed25519.SignatureSize) // zeroed signature
	ok, fail := Verify(ac)
	if ok || !contains(fail, "BAD-SIGNATURE") {
		t.Fatalf("a bad signature must fail end-to-end verification; ok=%v fail=%v", ok, fail)
	}
}

func TestIssueValidates(t *testing.T) {
	if _, err := Issue(Credential{Type: "X"}, issuerKey(t)); err == nil {
		t.Fatal("a credential missing id/subject/issuer must be rejected")
	}
}

func TestDeterministicHash(t *testing.T) {
	// same content, claims inserted in different orders → identical hash (sorted-key JSON)
	a := Credential{ID: "C", Type: "T", Subject: "S", Issuer: "I", IssuedAt: "d", Claims: map[string]string{"x": "1", "y": "2"}}
	b := Credential{ID: "C", Type: "T", Subject: "S", Issuer: "I", IssuedAt: "d", Claims: map[string]string{"y": "2", "x": "1"}}
	if a.Hash() != b.Hash() {
		t.Fatal("credential hash must be order-independent (canonical)")
	}
}

func contains(xs []string, s string) bool {
	for _, x := range xs {
		if x == s {
			return true
		}
	}
	return false
}
