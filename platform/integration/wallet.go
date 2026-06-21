package integration

import (
	"sort"

	"github.com/vasa-eos-se-tn/platform/credentials"
)

// recordCredential files an anchored credential into the subject's wallet (indexed by the credential subject —
// the learner's APAAR id). Called by every issuer (admission / enrolment / DBT receipt).
func (p *Platform) recordCredential(ac credentials.AnchoredCredential) {
	subj := ac.Signed.Credential.Subject
	if subj == "" {
		return
	}
	p.walletMu.Lock()
	p.wallet[subj] = append(p.wallet[subj], ac)
	p.walletMu.Unlock()
}

// WalletEntry is one verifiable credential in a learner's wallet, with its live verification verdict.
type WalletEntry struct {
	ID       string            `json:"id"`
	Type     string            `json:"type"`
	Issuer   string            `json:"issuer"`
	IssuedAt string            `json:"issued_at"`
	Claims   map[string]string `json:"claims,omitempty"`
	Valid    bool              `json:"valid"` // signature + notary inclusion proof both verify
	Failures []string          `json:"failures,omitempty"`
}

// Wallet is a learner's verifiable-credential wallet, each credential re-verified against the notary on read.
type Wallet struct {
	Subject     string        `json:"subject"`
	Credentials []WalletEntry `json:"credentials"`
	Count       int           `json:"count"`
	AllValid    bool          `json:"all_valid"`
}

// Wallet returns the learner's credentials (admission/enrolment/DBT receipts), each cryptographically
// re-verified end-to-end — the issuer signature AND the notary inclusion proof — so the holder (or any relying
// party) can confirm every credential is genuine and tamper-evident, not merely listed.
func (p *Platform) Wallet(subject string) Wallet {
	p.walletMu.Lock()
	creds := append([]credentials.AnchoredCredential(nil), p.wallet[subject]...)
	p.walletMu.Unlock()

	w := Wallet{Subject: subject, AllValid: true}
	for _, ac := range creds {
		valid, failures := credentials.Verify(ac)
		c := ac.Signed.Credential
		w.Credentials = append(w.Credentials, WalletEntry{
			ID: c.ID, Type: c.Type, Issuer: c.Issuer, IssuedAt: c.IssuedAt, Claims: c.Claims,
			Valid: valid, Failures: failures,
		})
		if !valid {
			w.AllValid = false
		}
	}
	sort.Slice(w.Credentials, func(i, j int) bool { return w.Credentials[i].ID < w.Credentials[j].ID })
	w.Count = len(w.Credentials)
	return w
}
