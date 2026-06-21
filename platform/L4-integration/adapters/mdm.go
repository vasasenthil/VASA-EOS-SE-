package adapters

import (
	"context"
	"net/http"
)

// MealRecord is the platform's domain shape for a PM-POSHAN / CMBS mid-day-meal record.
type MealRecord struct {
	SchoolUDISE string
	MealsServed int
	DaysServed  int
}

type mdmDTO struct {
	Udise string `json:"udise"`
	Meals int    `json:"meals_served"`
	Days  int    `json:"days_served"`
}

func (d mdmDTO) toDomain() MealRecord {
	return MealRecord{SchoolUDISE: d.Udise, MealsServed: d.Meals, DaysServed: d.Days}
}

// MDMClient is the resilient mid-day-meal (PM-POSHAN / CMBS) adapter. Gated on MoUs (B-022).
type MDMClient struct{ *core }

// NewMDMClient builds an MDM adapter.
func NewMDMClient(baseURL string, hc *http.Client) *MDMClient {
	return &MDMClient{core: newCore(baseURL, hc)}
}

// GetMeals fetches + transforms a school's meal record.
func (c *MDMClient) GetMeals(ctx context.Context, udise string) (MealRecord, error) {
	var dto mdmDTO
	if err := c.getJSON(ctx, "/mdm/meals/"+udise, &dto); err != nil {
		return MealRecord{}, err
	}
	return dto.toDomain(), nil
}
