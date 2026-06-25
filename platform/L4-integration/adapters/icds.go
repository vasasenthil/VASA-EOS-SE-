package adapters

import (
	"context"
	"net/http"
)

// AnganwadiRecord is the platform's domain shape for an ICDS pre-primary / Anganwadi readiness record.
type AnganwadiRecord struct {
	Code           string
	Children       int
	SchoolReadyPct float64
}

type icdsDTO struct {
	AwcCode  string  `json:"awc_code"`
	Children int     `json:"children_enrolled"`
	ReadyPct float64 `json:"school_readiness_pct"`
}

func (d icdsDTO) toDomain() AnganwadiRecord {
	return AnganwadiRecord{Code: d.AwcCode, Children: d.Children, SchoolReadyPct: d.ReadyPct}
}

// ICDSClient is the resilient ICDS (Anganwadi / pre-primary) adapter. Gated on MoUs (B-022).
type ICDSClient struct{ *core }

// NewICDSClient builds an ICDS adapter.
func NewICDSClient(baseURL string, hc *http.Client) *ICDSClient {
	return &ICDSClient{core: newCore(baseURL, hc)}
}

// GetAnganwadi fetches + transforms an Anganwadi centre record.
func (c *ICDSClient) GetAnganwadi(ctx context.Context, code string) (AnganwadiRecord, error) {
	var dto icdsDTO
	if err := c.getJSON(ctx, "/icds/awc/"+code, &dto); err != nil {
		return AnganwadiRecord{}, err
	}
	return dto.toDomain(), nil
}
