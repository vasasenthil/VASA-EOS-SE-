package adapters

import (
	"context"
	"net/http"
)

// BoardResult is the platform's domain shape for a TN State Board (DGE) examination result.
type BoardResult struct {
	RegisterNo string
	Passed     bool
	Marks      int
}

type tnboardDTO struct {
	RegNo  string `json:"register_no"`
	Result string `json:"result"` // "PASS" | "FAIL"
	Total  int    `json:"total_marks"`
}

func (d tnboardDTO) toDomain() BoardResult {
	return BoardResult{RegisterNo: d.RegNo, Passed: d.Result == "PASS", Marks: d.Total}
}

// TNBoardClient is the resilient TN State Board (DGE examinations) adapter. Gated on MoUs (B-022).
type TNBoardClient struct{ *core }

// NewTNBoardClient builds a TN Board adapter.
func NewTNBoardClient(baseURL string, hc *http.Client) *TNBoardClient {
	return &TNBoardClient{core: newCore(baseURL, hc)}
}

// GetResult fetches + transforms a board result by register number.
func (c *TNBoardClient) GetResult(ctx context.Context, regNo string) (BoardResult, error) {
	var dto tnboardDTO
	if err := c.getJSON(ctx, "/tnboard/result/"+regNo, &dto); err != nil {
		return BoardResult{}, err
	}
	return dto.toDomain(), nil
}
