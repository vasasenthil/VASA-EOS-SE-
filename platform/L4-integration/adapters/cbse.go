package adapters

import (
	"context"
	"net/http"
)

// AffiliationRecord is the platform's domain shape for a CBSE school affiliation record.
type AffiliationRecord struct {
	AffiliationNo string
	SchoolName    string
	Active        bool
}

type cbseDTO struct {
	AffNo  string `json:"affiliation_no"`
	Name   string `json:"school_name"`
	Status string `json:"status"` // "active" | "withdrawn"
}

func (d cbseDTO) toDomain() AffiliationRecord {
	return AffiliationRecord{AffiliationNo: d.AffNo, SchoolName: d.Name, Active: d.Status == "active"}
}

// CBSEClient is the resilient CBSE (board affiliation) adapter. Gated on MoUs (B-022).
type CBSEClient struct{ *core }

// NewCBSEClient builds a CBSE adapter.
func NewCBSEClient(baseURL string, hc *http.Client) *CBSEClient {
	return &CBSEClient{core: newCore(baseURL, hc)}
}

// GetAffiliation fetches + transforms a school's CBSE affiliation.
func (c *CBSEClient) GetAffiliation(ctx context.Context, affNo string) (AffiliationRecord, error) {
	var dto cbseDTO
	if err := c.getJSON(ctx, "/cbse/affiliation/"+affNo, &dto); err != nil {
		return AffiliationRecord{}, err
	}
	return dto.toDomain(), nil
}
