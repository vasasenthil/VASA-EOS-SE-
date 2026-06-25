package adapters

import (
	"context"
	"net/http"
)

// CredentialDoc is the platform's domain shape for a DigiLocker-held credential (issuer-agnostic).
type CredentialDoc struct {
	URI      string
	Type     string
	Issuer   string
	IssuedAt string
}

// digilockerDoc is the upstream DigiLocker wire shape (distinct field names → ACL transform).
type digilockerDoc struct {
	DocURI   string `json:"doc_uri"`
	DocType  string `json:"doc_type"`
	IssuedBy string `json:"issued_by"`
	IssuedOn string `json:"issued_on"`
}

func (d digilockerDoc) toDomain() CredentialDoc {
	return CredentialDoc{URI: d.DocURI, Type: d.DocType, Issuer: d.IssuedBy, IssuedAt: d.IssuedOn}
}

// DigiLockerClient is the resilient DigiLocker (MeitY) credential-vault adapter — lists the verifiable
// documents issued to a learner. Live endpoint/credentials are gated on MoUs (B-022).
type DigiLockerClient struct{ *core }

// NewDigiLockerClient builds a DigiLocker adapter over an upstream base URL.
func NewDigiLockerClient(baseURL string, hc *http.Client) *DigiLockerClient {
	return &DigiLockerClient{core: newCore(baseURL, hc)}
}

// GetCredentials lists and transforms the credentials held for a learner (by APAAR id).
func (c *DigiLockerClient) GetCredentials(ctx context.Context, apaarID string) ([]CredentialDoc, error) {
	var dtos []digilockerDoc
	if err := c.getJSON(ctx, "/digilocker/issued/"+apaarID, &dtos); err != nil {
		return nil, err
	}
	out := make([]CredentialDoc, len(dtos))
	for i, d := range dtos {
		out[i] = d.toDomain()
	}
	return out, nil
}
