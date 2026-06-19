package adapters

import (
	"context"
	"net/http"

	"github.com/vasa-eos-se-tn/platform/reconcile"
)

// udiseDTO is the upstream UDISE+/EMIS school-master wire shape (counts).
type udiseDTO struct {
	UdiseCode  string `json:"udise_code"`
	Students   int    `json:"students"`
	Teachers   int    `json:"teachers"`
	Classrooms int    `json:"classrooms"`
}

func (d udiseDTO) toDomain() reconcile.EmisSchoolData {
	return reconcile.EmisSchoolData{Students: d.Students, Teachers: d.Teachers, Classrooms: d.Classrooms}
}

// UDISEClient is the resilient UDISE+/EMIS adapter — the national source of truth for school master counts.
// Live endpoint/credentials are gated on MoUs (B-022).
type UDISEClient struct{ *core }

// NewUDISEClient builds a UDISE+ adapter over an upstream base URL.
func NewUDISEClient(baseURL string, hc *http.Client) *UDISEClient {
	return &UDISEClient{core: newCore(baseURL, hc)}
}

// GetSchool fetches and transforms the EMIS master counts for a UDISE code.
func (c *UDISEClient) GetSchool(ctx context.Context, udise string) (reconcile.EmisSchoolData, error) {
	var dto udiseDTO
	if err := c.getJSON(ctx, "/udise/school/"+udise, &dto); err != nil {
		return reconcile.EmisSchoolData{}, err
	}
	return dto.toDomain(), nil
}

// Reconcile compares the EMIS student count against the local on-roll figure (count tolerance); teachers and
// classrooms are surfaced as upstream-only context.
func (c *UDISEClient) Reconcile(ctx context.Context, udise string, localOnRoll *int) (reconcile.NumericReport, error) {
	up, err := c.GetSchool(ctx, udise)
	if err != nil {
		return reconcile.NumericReport{}, err
	}
	return reconcile.CompareEmisToEnrolment(up, localOnRoll, reconcile.DefaultTolerancePct), nil
}
