package adapters

import (
	"context"
	"net/http"
)

// LearningResource is the platform's domain shape for a DIKSHA content item.
type LearningResource struct {
	ID      string
	Title   string
	Subject string
	Grade   int
	URL     string
}

// dikshaDTO is the upstream DIKSHA wire shape (distinct field names → ACL transform).
type dikshaDTO struct {
	Identifier  string `json:"identifier"`
	Name        string `json:"name"`
	Subject     string `json:"subject"`
	GradeLevel  int    `json:"gradeLevel"`
	ArtifactURL string `json:"artifactUrl"`
}

func (d dikshaDTO) toDomain() LearningResource {
	return LearningResource{ID: d.Identifier, Title: d.Name, Subject: d.Subject, Grade: d.GradeLevel, URL: d.ArtifactURL}
}

// DIKSHAClient is the resilient DIKSHA (national content platform) adapter — fetches a learning resource.
// Live endpoint/credentials are gated on MoUs (B-022).
type DIKSHAClient struct{ *core }

// NewDIKSHAClient builds a DIKSHA adapter over an upstream base URL.
func NewDIKSHAClient(baseURL string, hc *http.Client) *DIKSHAClient {
	return &DIKSHAClient{core: newCore(baseURL, hc)}
}

// GetResource fetches and transforms a content item by its DIKSHA identifier.
func (c *DIKSHAClient) GetResource(ctx context.Context, id string) (LearningResource, error) {
	var dto dikshaDTO
	if err := c.getJSON(ctx, "/diksha/content/"+id, &dto); err != nil {
		return LearningResource{}, err
	}
	return dto.toDomain(), nil
}
