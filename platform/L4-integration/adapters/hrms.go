package adapters

import (
	"context"
	"net/http"
)

// TeacherRecord is the platform's domain shape for an HRMS-TN staff record (NDEAR-S Teacher Registry).
type TeacherRecord struct {
	EmployeeID  string
	Name        string
	Designation string
	SchoolUDISE string
	Teaching    bool
}

type hrmsDTO struct {
	EmpID    string `json:"emp_id"`
	FullName string `json:"full_name"`
	Desig    string `json:"designation"`
	Udise    string `json:"posting_udise"`
	Cadre    string `json:"cadre"` // "teaching" | "non-teaching"
}

func (d hrmsDTO) toDomain() TeacherRecord {
	return TeacherRecord{EmployeeID: d.EmpID, Name: d.FullName, Designation: d.Desig, SchoolUDISE: d.Udise, Teaching: d.Cadre == "teaching"}
}

// HRMSClient is the resilient HRMS-TN (teacher/staff registry) adapter. Live creds gated on MoUs (B-022).
type HRMSClient struct{ *core }

// NewHRMSClient builds an HRMS adapter over an upstream base URL.
func NewHRMSClient(baseURL string, hc *http.Client) *HRMSClient {
	return &HRMSClient{core: newCore(baseURL, hc)}
}

// GetTeacher fetches + transforms a staff record by employee id.
func (c *HRMSClient) GetTeacher(ctx context.Context, empID string) (TeacherRecord, error) {
	var dto hrmsDTO
	if err := c.getJSON(ctx, "/hrms/staff/"+empID, &dto); err != nil {
		return TeacherRecord{}, err
	}
	return dto.toDomain(), nil
}
