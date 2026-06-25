package adapters

import (
	"context"
	"net/http"
)

// Settlement is the platform's domain shape for a BSP/APBS (Aadhaar Payment Bridge) DBT settlement record.
type Settlement struct {
	TxnID     string
	Account   string
	AmountINR float64
	Settled   bool
}

type bspDTO struct {
	Txn    string  `json:"txn_id"`
	Acct   string  `json:"beneficiary_account"`
	Amount float64 `json:"amount"`
	Status string  `json:"settlement_status"` // "SETTLED" | "PENDING" | "FAILED"
}

func (d bspDTO) toDomain() Settlement {
	return Settlement{TxnID: d.Txn, Account: d.Acct, AmountINR: d.Amount, Settled: d.Status == "SETTLED"}
}

// BSPClient is the resilient banking-settlement (APBS / DBT) adapter. Gated on MoUs (B-022).
type BSPClient struct{ *core }

// NewBSPClient builds a BSP adapter.
func NewBSPClient(baseURL string, hc *http.Client) *BSPClient {
	return &BSPClient{core: newCore(baseURL, hc)}
}

// GetSettlement fetches + transforms a DBT settlement by transaction id.
func (c *BSPClient) GetSettlement(ctx context.Context, txnID string) (Settlement, error) {
	var dto bspDTO
	if err := c.getJSON(ctx, "/bsp/settlement/"+txnID, &dto); err != nil {
		return Settlement{}, err
	}
	return dto.toDomain(), nil
}
