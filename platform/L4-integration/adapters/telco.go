package adapters

import (
	"context"
	"net/http"
)

// DeliveryReceipt is the platform's domain shape for a telco SMS delivery receipt (notification channel).
type DeliveryReceipt struct {
	MessageID string
	MSISDN    string
	Delivered bool
}

type telcoDTO struct {
	MsgID string `json:"message_id"`
	To    string `json:"msisdn"`
	State string `json:"dlr_state"` // "DELIVRD" | "FAILED" | "EXPIRED"
}

func (d telcoDTO) toDomain() DeliveryReceipt {
	return DeliveryReceipt{MessageID: d.MsgID, MSISDN: d.To, Delivered: d.State == "DELIVRD"}
}

// TelcoClient is the resilient telco SMS-gateway adapter (citizen notification reach). Gated on MoUs (B-022).
type TelcoClient struct{ *core }

// NewTelcoClient builds a telco adapter.
func NewTelcoClient(baseURL string, hc *http.Client) *TelcoClient {
	return &TelcoClient{core: newCore(baseURL, hc)}
}

// GetReceipt fetches + transforms an SMS delivery receipt by message id.
func (c *TelcoClient) GetReceipt(ctx context.Context, msgID string) (DeliveryReceipt, error) {
	var dto telcoDTO
	if err := c.getJSON(ctx, "/telco/dlr/"+msgID, &dto); err != nil {
		return DeliveryReceipt{}, err
	}
	return dto.toDomain(), nil
}
