// Package kms implements VASA-EOS(SE) TN envelope encryption with a per-tenant key hierarchy (CC-SPEC-001
// §17.4, §2.4 DPDP data protection).
//
// Key hierarchy (three tiers):
//
//	ROOT KEK  — held in the State HSM (BLOCKERS B-002). Never leaves the HSM in production. Here it is a
//	            32-byte seed supplied to New(); the HSM is the swap-in seam (HSMRoot, future).
//	TENANT KEK — derived per tenant from the root via HKDF-SHA256(root, "vasa-kek/<tenant>/<generation>").
//	            Deterministic, so it need not be stored; rotating the generation re-keys a tenant.
//	DATA  DEK  — a fresh random 256-bit key per object; encrypts the payload with AES-256-GCM. The DEK is
//	            itself wrapped (AES-256-GCM) under the tenant KEK and stored beside the ciphertext.
//
// Properties: tenant isolation (one tenant's KEK cannot unwrap another's DEK — GCM authentication fails);
// crypto-shredding (drop a tenant's KEK generation → its data is unrecoverable); envelope rotation (re-wrap
// the DEK under a new KEK generation WITHOUT re-encrypting the bulk data). Stdlib-only.
package kms

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"errors"
	"fmt"
	"io"
)

// KMS wraps a root key at a given generation. Rotate() produces the next generation.
type KMS struct {
	root       []byte
	generation uint32
	rnd        io.Reader
}

// New constructs a KMS over a 32-byte root key (in production, an HSM handle). generation starts at 1.
func New(root []byte) (*KMS, error) {
	if len(root) != 32 {
		return nil, fmt.Errorf("kms: root key must be 32 bytes, got %d", len(root))
	}
	cp := make([]byte, 32)
	copy(cp, root)
	return &KMS{root: cp, generation: 1, rnd: rand.Reader}, nil
}

// NewRandom constructs a KMS with a fresh random root (tests / ephemeral).
func NewRandom() (*KMS, error) {
	root := make([]byte, 32)
	if _, err := io.ReadFull(rand.Reader, root); err != nil {
		return nil, err
	}
	return New(root)
}

// Generation reports the current KEK generation.
func (k *KMS) Generation() uint32 { return k.generation }

// Rotate returns a new KMS over the same root at the next KEK generation. Existing envelopes must be
// Rewrap-ed to the new generation; bulk ciphertext is unchanged.
func (k *KMS) Rotate() *KMS {
	return &KMS{root: k.root, generation: k.generation + 1, rnd: k.rnd}
}

// tenantKEK derives the deterministic 32-byte KEK for a tenant at this generation (HKDF-Expand, SHA-256).
func (k *KMS) tenantKEK(tenant string) []byte {
	info := []byte(fmt.Sprintf("vasa-kek/%s/%d", tenant, k.generation))
	return hkdfExpand(k.root, info, 32)
}

// Envelope is the stored, portable encryption result. WrappedDEK and Ciphertext each carry their GCM nonce
// as a prefix. Generation records which KEK generation wrapped the DEK (for rotation).
type Envelope struct {
	Tenant     string `json:"tenant"`
	Generation uint32 `json:"generation"`
	WrappedDEK []byte `json:"wrapped_dek"` // nonce || AES-GCM(KEK, DEK, aad=tenant)
	Ciphertext []byte `json:"ciphertext"`  // nonce || AES-GCM(DEK, plaintext, aad=caller-aad)
}

// Encrypt seals plaintext for a tenant. aad is additional authenticated data bound to the ciphertext
// (e.g. a record id / classification) — it must be supplied identically to Decrypt.
func (k *KMS) Encrypt(tenant string, plaintext, aad []byte) (Envelope, error) {
	if tenant == "" {
		return Envelope{}, errors.New("kms: tenant required")
	}
	dek := make([]byte, 32)
	if _, err := io.ReadFull(k.rnd, dek); err != nil {
		return Envelope{}, err
	}
	ct, err := gcmSeal(dek, plaintext, aad, k.rnd)
	if err != nil {
		return Envelope{}, err
	}
	wrapped, err := gcmSeal(k.tenantKEK(tenant), dek, []byte(tenant), k.rnd)
	if err != nil {
		return Envelope{}, err
	}
	return Envelope{Tenant: tenant, Generation: k.generation, WrappedDEK: wrapped, Ciphertext: ct}, nil
}

// Decrypt opens an envelope. It fails (authentication error) if the tenant or aad differ, or if this KMS's
// KEK generation does not match the envelope's.
func (k *KMS) Decrypt(env Envelope, aad []byte) ([]byte, error) {
	if env.Generation != k.generation {
		return nil, fmt.Errorf("kms: envelope generation %d != KMS generation %d (rewrap required)", env.Generation, k.generation)
	}
	dek, err := gcmOpen(k.tenantKEK(env.Tenant), env.WrappedDEK, []byte(env.Tenant))
	if err != nil {
		return nil, fmt.Errorf("kms: unwrap DEK (tenant/KEK mismatch): %w", err)
	}
	pt, err := gcmOpen(dek, env.Ciphertext, aad)
	if err != nil {
		return nil, fmt.Errorf("kms: decrypt payload (aad mismatch or tamper): %w", err)
	}
	return pt, nil
}

// Rewrap re-wraps an envelope's DEK from a previous KMS generation to this one WITHOUT touching the bulk
// ciphertext (envelope rotation). prev must hold the generation that sealed env.
func (k *KMS) Rewrap(prev *KMS, env Envelope) (Envelope, error) {
	if env.Generation != prev.generation {
		return Envelope{}, fmt.Errorf("kms: envelope generation %d != prev generation %d", env.Generation, prev.generation)
	}
	dek, err := gcmOpen(prev.tenantKEK(env.Tenant), env.WrappedDEK, []byte(env.Tenant))
	if err != nil {
		return Envelope{}, fmt.Errorf("kms: unwrap with prev KEK: %w", err)
	}
	rewrapped, err := gcmSeal(k.tenantKEK(env.Tenant), dek, []byte(env.Tenant), k.rnd)
	if err != nil {
		return Envelope{}, err
	}
	env.WrappedDEK = rewrapped
	env.Generation = k.generation
	return env, nil
}

// --- AES-256-GCM helpers (nonce prefixed to the ciphertext) ---

func gcmSeal(key, plaintext, aad []byte, rnd io.Reader) ([]byte, error) {
	gcm, err := newGCM(key)
	if err != nil {
		return nil, err
	}
	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rnd, nonce); err != nil {
		return nil, err
	}
	return gcm.Seal(nonce, nonce, plaintext, aad), nil
}

func gcmOpen(key, blob, aad []byte) ([]byte, error) {
	gcm, err := newGCM(key)
	if err != nil {
		return nil, err
	}
	ns := gcm.NonceSize()
	if len(blob) < ns {
		return nil, errors.New("kms: ciphertext too short")
	}
	return gcm.Open(nil, blob[:ns], blob[ns:], aad)
}

func newGCM(key []byte) (cipher.AEAD, error) {
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}
	return cipher.NewGCM(block)
}

// hkdfExpand is RFC-5869 HKDF-Expand (SHA-256), stdlib-only. The root acts as the pseudorandom key.
func hkdfExpand(prk, info []byte, length int) []byte {
	hashLen := sha256.Size
	n := (length + hashLen - 1) / hashLen
	var t, okm []byte
	for i := 1; i <= n; i++ {
		h := hmac.New(sha256.New, prk)
		h.Write(t)
		h.Write(info)
		h.Write([]byte{byte(i)})
		t = h.Sum(nil)
		okm = append(okm, t...)
	}
	return okm[:length]
}
