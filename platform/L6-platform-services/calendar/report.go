package calendar

import (
	"sort"
	"time"
)

// Summary is the realtime academic-calendar dashboard roll-up over a set of entries.
type Summary struct {
	Total            int            `json:"total"`
	ByType           map[string]int `json:"by_type"`
	ByStatus         map[string]int `json:"by_status"`
	PendingApprovals int            `json:"pending_approvals"`
	Published        int            `json:"published"`
	Upcoming         []Entry        `json:"upcoming"` // next published entries on/after the reference date
}

// Summarise rolls up a list of entries into a dashboard summary. `from` (YYYY-MM-DD) is the reference date for
// the upcoming feed; `n` caps it. Entries are assumed already scoped/filtered by the caller.
func Summarise(entries []Entry, from string, n int) Summary {
	s := Summary{ByType: map[string]int{}, ByStatus: map[string]int{}}
	s.Total = len(entries)
	for _, e := range entries {
		s.ByType[e.Type]++
		s.ByStatus[e.Status]++
		if e.Status == Pending {
			s.PendingApprovals++
		}
		if e.Published() {
			s.Published++
		}
	}
	s.Upcoming = upcomingPublished(entries, from, n)
	return s
}

// upcomingPublished returns the next n published entries with StartDate >= from, in date order.
func upcomingPublished(entries []Entry, from string, n int) []Entry {
	ref, err := time.Parse(dateLayout, from)
	var up []Entry
	for _, e := range entries {
		if !e.Published() {
			continue
		}
		if err == nil {
			d, derr := time.Parse(dateLayout, e.StartDate)
			if derr == nil && d.Before(ref) {
				continue
			}
		}
		up = append(up, e)
	}
	sort.Slice(up, func(i, j int) bool {
		if up[i].StartDate != up[j].StartDate {
			return up[i].StartDate < up[j].StartDate
		}
		return up[i].ID < up[j].ID
	})
	if n > 0 && len(up) > n {
		up = up[:n]
	}
	return up
}

// PendingFor returns the entries currently awaiting a decision by the given approver role — the role-gated
// approval inbox (an officer sees only the entries whose CURRENT level they are entitled to act on).
func PendingFor(entries []Entry, approverRole string) []Entry {
	var out []Entry
	for _, e := range entries {
		if e.Status != Pending || e.CurrentStep >= len(e.Chain) {
			continue
		}
		if e.Chain[e.CurrentStep].ApproverRole == approverRole {
			out = append(out, e)
		}
	}
	sort.Slice(out, func(i, j int) bool { return out[i].StartDate < out[j].StartDate })
	return out
}
