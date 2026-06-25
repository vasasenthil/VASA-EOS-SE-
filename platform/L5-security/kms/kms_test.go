package kms

import (
	"bytes"
	"testing"
)

func mustKMS(t *testing.T) *KMS {
	t.Helper()
	k, err := NewRandom()
	if err != nil {
		t.Fatal(err)
	}
	return k
}

func TestRoundTrip(t *testing.T) {
	k := mustKMS(t)
	pt := []byte("Aadhaar: XXXX-XXXX-1234; APAAR id of a minor")
	aad := []byte("record:student/42")
	env, err := k.Encrypt("TN/Chennai", pt, aad)
	if err != nil {
		t.Fatal(err)
	}
	if bytes.Contains(env.Ciphertext, []byte("Aadhaar")) {
		t.Fatal("plaintext leaked into ciphertext")
	}
	got, err := k.Decrypt(env, aad)
	if err != nil {
		t.Fatal(err)
	}
	if !bytes.Equal(got, pt) {
		t.Fatalf("round-trip mismatch: %q", got)
	}
}

func TestTenantIsolation(t *testing.T) {
	k := mustKMS(t)
	env, _ := k.Encrypt("TN/Chennai", []byte("confidential"), nil)
	// forge the tenant label on the envelope — the KEK for Madurai cannot unwrap Chennai's DEK.
	env.Tenant = "TN/Madurai"
	if _, err := k.Decrypt(env, nil); err == nil {
		t.Fatal("one tenant's KEK must not unwrap another tenant's DEK")
	}
}

func TestAADBinding(t *testing.T) {
	k := mustKMS(t)
	env, _ := k.Encrypt("TN/Chennai", []byte("marks"), []byte("record:1"))
	if _, err := k.Decrypt(env, []byte("record:2")); err == nil {
		t.Fatal("decrypt must fail when AAD differs (context binding)")
	}
}

func TestTamperDetected(t *testing.T) {
	k := mustKMS(t)
	env, _ := k.Encrypt("TN/Chennai", []byte("immutable"), nil)
	env.Ciphertext[len(env.Ciphertext)-1] ^= 0xFF // flip a byte
	if _, err := k.Decrypt(env, nil); err == nil {
		t.Fatal("GCM must detect ciphertext tampering")
	}
}

func TestRotationRewrapsWithoutReEncrypting(t *testing.T) {
	k1 := mustKMS(t)
	pt := []byte("durable payload")
	env1, _ := k1.Encrypt("TN/Chennai", pt, nil)

	k2 := k1.Rotate()
	if k2.Generation() != k1.Generation()+1 {
		t.Fatalf("rotate must bump generation: %d -> %d", k1.Generation(), k2.Generation())
	}
	// new generation cannot read the old envelope until rewrapped
	if _, err := k2.Decrypt(env1, nil); err == nil {
		t.Fatal("post-rotation KMS must not read a pre-rotation envelope without rewrap")
	}

	env2, err := k2.Rewrap(k1, env1)
	if err != nil {
		t.Fatal(err)
	}
	// the bulk ciphertext is untouched by rotation — only the wrapped DEK changed
	if !bytes.Equal(env2.Ciphertext, env1.Ciphertext) {
		t.Fatal("rewrap must NOT re-encrypt the bulk ciphertext")
	}
	if bytes.Equal(env2.WrappedDEK, env1.WrappedDEK) {
		t.Fatal("rewrap must change the wrapped DEK")
	}
	got, err := k2.Decrypt(env2, nil)
	if err != nil {
		t.Fatal(err)
	}
	if !bytes.Equal(got, pt) {
		t.Fatal("rewrapped envelope must decrypt to the original plaintext")
	}
	// the old generation can no longer read the rewrapped envelope (crypto-shred path)
	if _, err := k1.Decrypt(env2, nil); err == nil {
		t.Fatal("old generation must not read a rewrapped envelope")
	}
}

func TestRejectsBadRoot(t *testing.T) {
	if _, err := New(make([]byte, 16)); err == nil {
		t.Fatal("root must be exactly 32 bytes")
	}
}

func TestEmptyTenantRejected(t *testing.T) {
	k := mustKMS(t)
	if _, err := k.Encrypt("", []byte("x"), nil); err == nil {
		t.Fatal("empty tenant must be rejected")
	}
}

func TestDeterministicTenantKEK(t *testing.T) {
	root := make([]byte, 32)
	for i := range root {
		root[i] = byte(i)
	}
	a, _ := New(root)
	b, _ := New(root)
	// same root + tenant + generation must derive the same KEK, so b can decrypt a's envelope
	env, _ := a.Encrypt("TN/Salem", []byte("portable"), nil)
	got, err := b.Decrypt(env, nil)
	if err != nil || string(got) != "portable" {
		t.Fatalf("tenant KEK derivation must be deterministic across KMS instances: %v %q", err, got)
	}
}
