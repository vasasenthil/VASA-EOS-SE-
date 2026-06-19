// Package credentials issues L7 verifiable credentials anchored to the notary (CC-SPEC-001 §7.2, §20).
//
// A credential (an APAAR-linked marksheet, a transfer certificate, a completion record) is issued by a State
// authority: it is ed25519-signed over its canonical bytes, and its hash is anchored to the notary ledger so
// its existence and integrity are independently provable. A holder presents the signed credential plus a
// Merkle inclusion proof; a verifier confirms (1) the issuer's signature, and (2) that the credential's hash
// was notarised — without trusting the platform. This is the DigiLocker-shaped issuance path (live push is
// gated on B-022); the cryptographic core is complete here. Stdlib-only.
package credentials

import (
	"crypto/ed25519"
	"encoding/json"
	"errors"

	"github.com/vasa-eos-se-tn/platform/notary"
)

// Credential is the issued claim set. Claims is a sorted-key map so its JSON is deterministic.
type Credential struct {
	ID       string            `json:"id"`
	Type     string            `json:"type"`    // e.g. "MarkSheet", "TransferCertificate"
	Subject  string            `json:"subject"` // the holder reference (e.g. APAAR id)
	Issuer   string            `json:"issuer"`  // the issuing authority
	IssuedAt string            `json:"issued_at"`
	Claims   map[string]string `json:"claims"`
}

// CanonicalBytes is the deterministic byte encoding signed and hashed (Go marshals map keys sorted).
func (c Credential) CanonicalBytes() []byte {
	b, _ := json.Marshal(c)
	return b
}

// Hash is the notary leaf hash of the credential.
func (c Credential) Hash() string { return notary.HashItem(c.CanonicalBytes()) }

// SignedCredential is a credential plus the issuer's signature and public key.
type SignedCredential struct {
	Credential Credential
	Signature  []byte
	PubKey     ed25519.PublicKey
}

// Issue signs a credential with the issuer's private key.
func Issue(c Credential, priv ed25519.PrivateKey) (SignedCredential, error) {
	if c.ID == "" || c.Subject == "" || c.Issuer == "" {
		return SignedCredential{}, errors.New("credentials: id, subject and issuer are required")
	}
	sig := ed25519.Sign(priv, c.CanonicalBytes())
	return SignedCredential{Credential: c, Signature: sig, PubKey: priv.Public().(ed25519.PublicKey)}, nil
}

// VerifySignature checks the issuer's signature over the credential's canonical bytes.
func (sc SignedCredential) VerifySignature() bool {
	if len(sc.PubKey) != ed25519.PublicKeySize {
		return false
	}
	return ed25519.Verify(sc.PubKey, sc.Credential.CanonicalBytes(), sc.Signature)
}

// AnchoredCredential is a signed credential with its notary inclusion proof.
type AnchoredCredential struct {
	Signed SignedCredential
	Proof  notary.Proof
}

// AnchorBatch anchors a batch of signed credentials into a single notary block and returns an anchored
// credential (signed + inclusion proof) for each. The block's Merkle root is the single value submitted to
// the Besu network (B-020).
func AnchorBatch(l *notary.Ledger, creds []SignedCredential) (notary.Block, []AnchoredCredential, error) {
	if len(creds) == 0 {
		return notary.Block{}, nil, errors.New("credentials: nothing to anchor")
	}
	leaves := make([]string, len(creds))
	for i, sc := range creds {
		leaves[i] = sc.Credential.Hash()
	}
	block, err := l.Anchor(leaves)
	if err != nil {
		return notary.Block{}, nil, err
	}
	out := make([]AnchoredCredential, len(creds))
	for i, sc := range creds {
		proof, err := l.Prove(block.Index, sc.Credential.Hash())
		if err != nil {
			return notary.Block{}, nil, err
		}
		out[i] = AnchoredCredential{Signed: sc, Proof: proof}
	}
	return block, out, nil
}

// Verify confirms an anchored credential end-to-end: the issuer's signature is valid, the inclusion proof is
// valid, and the proof's leaf is exactly this credential's hash (binding the proof to the credential).
// Returns the failed checks (empty when valid).
func Verify(ac AnchoredCredential) (bool, []string) {
	var fail []string
	if !ac.Signed.VerifySignature() {
		fail = append(fail, "BAD-SIGNATURE")
	}
	if ac.Proof.Leaf != ac.Signed.Credential.Hash() {
		fail = append(fail, "PROOF-NOT-FOR-CREDENTIAL")
	}
	if !notary.VerifyProof(ac.Proof) {
		fail = append(fail, "BAD-INCLUSION-PROOF")
	}
	return len(fail) == 0, fail
}
