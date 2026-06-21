package adapters

import (
	"context"
	"net/http"
)

// TreasuryAllocation is the platform's domain shape for an IFMS-TN treasury sanction (state finance).
type TreasuryAllocation struct {
	Scheme        string
	HeadOfAccount string
	SanctionedINR float64
}

type ifmsDTO struct {
	SchemeCode string  `json:"scheme_code"`
	HOA        string  `json:"head_of_account"`
	Sanctioned float64 `json:"sanctioned_amount"`
}

func (d ifmsDTO) toDomain() TreasuryAllocation {
	return TreasuryAllocation{Scheme: d.SchemeCode, HeadOfAccount: d.HOA, SanctionedINR: d.Sanctioned}
}

// IFMSClient is the resilient IFMS-TN (Integrated Financial Management System) adapter. Gated on MoUs (B-022).
type IFMSClient struct{ *core }

// NewIFMSClient builds an IFMS adapter.
func NewIFMSClient(baseURL string, hc *http.Client) *IFMSClient {
	return &IFMSClient{core: newCore(baseURL, hc)}
}

// GetAllocation fetches + transforms a treasury allocation for a scheme.
func (c *IFMSClient) GetAllocation(ctx context.Context, scheme string) (TreasuryAllocation, error) {
	var dto ifmsDTO
	if err := c.getJSON(ctx, "/ifms/allocation/"+scheme, &dto); err != nil {
		return TreasuryAllocation{}, err
	}
	return dto.toDomain(), nil
}
