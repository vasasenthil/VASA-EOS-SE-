package integration

// Revocation is a record that a credential has been revoked (the NDEAR-S credential revocation registry). A
// credential's signature + notary proof remain mathematically valid forever, so revocation is a separate,
// authoritative status the verifier MUST consult — a revoked credential is no longer trustworthy even though
// it still verifies cryptographically.
type Revocation struct {
	CredentialID string `json:"credential_id"`
	Revoked      bool   `json:"revoked"`
	By           string `json:"by"`
	Reason       string `json:"reason"`
	At           string `json:"at"`
}

// RevokeCredential records a credential as revoked (e.g. issued in error, superseded, fraud). It is audited.
func (p *Platform) RevokeCredential(credentialID, by, reason string) Revocation {
	r := Revocation{CredentialID: credentialID, Revoked: true, By: by, Reason: reason, At: p.now()}
	p.revMu.Lock()
	p.revoked[credentialID] = r
	p.revMu.Unlock()
	p.appendAudit("role:"+by, "credential.revoke", credentialID, "revoked", reason)
	return r
}

// RevocationStatus returns whether a credential is revoked (and the revocation record).
func (p *Platform) RevocationStatus(credentialID string) (Revocation, bool) {
	p.revMu.Lock()
	defer p.revMu.Unlock()
	r, ok := p.revoked[credentialID]
	return r, ok && r.Revoked
}
