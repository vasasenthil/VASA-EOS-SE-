package integration

import (
	"context"

	"github.com/vasa-eos-se-tn/platform/adapters"
)

// SetContentResolver wires an optional content resolver (e.g. DIKSHA-backed) so the tutor can cite real
// learning resources for a target concept. Safe to leave unset — the tutor degrades to no citation.
func (p *Platform) SetContentResolver(c ContentResolver) { p.Content = c }

// DikshaContentResolver resolves a curriculum concept to a DIKSHA resource via a concept→DIKSHA-id mapping
// and the resilient DIKSHA adapter. A fetch failure resolves to ok=false (the tutor still serves).
type DikshaContentResolver struct {
	Client  *adapters.DIKSHAClient
	Mapping map[string]string // curriculum concept id → DIKSHA content identifier
}

// NewDikshaContentResolver builds a resolver over a DIKSHA client and a concept→content map.
func NewDikshaContentResolver(client *adapters.DIKSHAClient, mapping map[string]string) *DikshaContentResolver {
	return &DikshaContentResolver{Client: client, Mapping: mapping}
}

// Resolve maps the concept to a DIKSHA id and fetches the resource's title + URL.
func (r *DikshaContentResolver) Resolve(ctx context.Context, conceptID string) (title, url string, ok bool) {
	id, mapped := r.Mapping[conceptID]
	if !mapped || r.Client == nil {
		return "", "", false
	}
	res, err := r.Client.GetResource(ctx, id)
	if err != nil {
		return "", "", false
	}
	return res.Title, res.URL, true
}
