package integration

import (
	"hash/fnv"
	"sort"

	"github.com/vasa-eos-se-tn/platform/engines"
	"github.com/vasa-eos-se-tn/platform/seed"
)

// DistrictIndicator is one district's value on a cohort indicator, with its anomaly grading.
type DistrictIndicator struct {
	District  string  `json:"district"`
	Value     float64 `json:"value"`
	Z         float64 `json:"z"`
	Flagged   bool    `json:"flagged"`             // an early-warning anomaly (|z| over threshold)
	Direction string  `json:"direction,omitempty"` // high | low
}

// CohortReport is the L8-analytics early-warning surface over the estate: a per-district indicator series with
// the anomalous (early-warning) districts flagged by the z-score detector.
type CohortReport struct {
	Indicator string              `json:"indicator"`
	Z         float64             `json:"z"`
	Mean      float64             `json:"mean"`
	Districts []DistrictIndicator `json:"districts"`
	Flagged   []string            `json:"flagged"`   // district names needing attention
	Synthetic bool                `json:"synthetic"` // the indicator values are illustrative (telemetry gated)
}

// indicatorValue derives a deterministic per-district value for a named indicator. The district structure is
// real (seed.Districts); the values are SYNTHETIC/illustrative because live operational telemetry (attendance,
// dropout, FLN) is gated on the federated substrate (B-022). A couple of districts carry a deliberate spike/dip
// so the early-warning detector has something to find.
func indicatorValue(indicator, district string, idx int) float64 {
	h := fnv.New32a()
	_, _ = h.Write([]byte(indicator + ":" + district))
	base := 45 + float64(h.Sum32()%11) // 45..55 baseline jitter
	switch district {
	case "Nilgiris": // a hill district — illustrative early-warning spike
		base += 40
	case "Ramanathapuram": // illustrative dip
		base -= 30
	}
	return base
}

// CohortAnomalies runs the L8 analytics anomaly detector over a per-district indicator series across the real
// estate, flagging the districts that need attention (early warning). z defaults to engines.DefaultZ.
func (p *Platform) CohortAnomalies(indicator string, z float64) CohortReport {
	if indicator == "" {
		indicator = "dropout-risk"
	}
	if z <= 0 {
		z = engines.DefaultZ
	}
	districts := seed.Districts
	series := make([]float64, len(districts))
	var sum float64
	for i, d := range districts {
		series[i] = indicatorValue(indicator, d, i)
		sum += series[i]
	}
	anoms := engines.Anomalies(series, z)
	flaggedIdx := map[int]engines.Anomaly{}
	for _, a := range anoms {
		flaggedIdx[a.Index] = a
	}
	mean := sum / float64(len(series))

	rep := CohortReport{Indicator: indicator, Z: z, Mean: mean, Synthetic: true}
	for i, d := range districts {
		di := DistrictIndicator{District: d, Value: series[i]}
		if a, ok := flaggedIdx[i]; ok {
			di.Flagged, di.Z = true, a.Z
			if series[i] >= mean {
				di.Direction = "high"
			} else {
				di.Direction = "low"
			}
			rep.Flagged = append(rep.Flagged, d)
		}
		rep.Districts = append(rep.Districts, di)
	}
	sort.Strings(rep.Flagged)
	return rep
}
