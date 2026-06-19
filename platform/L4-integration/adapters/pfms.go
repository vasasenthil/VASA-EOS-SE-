package adapters

import (
	"context"
	"net/http"

	"github.com/vasa-eos-se-tn/platform/reconcile"
)

// pfmsDTO is the upstream PFMS fund-flow wire shape (amounts in rupees, distinct field names from the domain).
type pfmsDTO struct {
	SchemeCode string  `json:"scheme_code"`
	Allocated  float64 `json:"allocated_inr"`
	Released   float64 `json:"released_inr"`
	Utilised   float64 `json:"utilised_inr"`
}

func (d pfmsDTO) toDomain() reconcile.PfmsExpenditure {
	return reconcile.PfmsExpenditure{Allocated: d.Allocated, Released: d.Released, Utilised: d.Utilised}
}

// PFMSClient is the resilient PFMS (Public Financial Management System) fund-flow adapter — the source of
// truth for scheme allocation/release/utilisation. Live endpoint/credentials are gated on MoUs (B-022).
type PFMSClient struct{ *core }

// NewPFMSClient builds a PFMS adapter over an upstream base URL.
func NewPFMSClient(baseURL string, hc *http.Client) *PFMSClient {
	return &PFMSClient{core: newCore(baseURL, hc)}
}

// GetExpenditure fetches and transforms the fund-flow figures for a scheme.
func (c *PFMSClient) GetExpenditure(ctx context.Context, scheme string) (reconcile.PfmsExpenditure, error) {
	var dto pfmsDTO
	if err := c.getJSON(ctx, "/pfms/expenditure/"+scheme, &dto); err != nil {
		return reconcile.PfmsExpenditure{}, err
	}
	return dto.toDomain(), nil
}

// Reconcile compares PFMS figures against the local scheme ledger (tight money tolerance; any drift is a
// potential leakage/mis-posting to investigate).
func (c *PFMSClient) Reconcile(ctx context.Context, scheme string, local *reconcile.FundLedger) (reconcile.NumericReport, error) {
	up, err := c.GetExpenditure(ctx, scheme)
	if err != nil {
		return reconcile.NumericReport{}, err
	}
	return reconcile.CompareFundFlowToPfms(up, local), nil
}
