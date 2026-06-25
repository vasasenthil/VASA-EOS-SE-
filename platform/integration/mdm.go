package integration

import (
	"fmt"
	"log"
	"os"
	"sync"

	"github.com/vasa-eos-se-tn/platform/mdm"
)

// Mid-Day Meal (PM-POSHAN) is an L6 accountability vertical: it keeps each school's foodgrain stock ledger and
// daily meal-service register, enforcing that stock can never go negative (a day can never cook more grain than
// is on hand — the leakage gate) and that meals served never exceed enrolment. Durable to PostgreSQL.
var (
	mdmOnce sync.Once
	mdmBack mdmStore
)

// mdmStore is the persistence port (stock ledger + meal register).
type mdmStore interface {
	Receive(mdm.LedgerEntry) (mdm.LedgerEntry, error)
	Serve(mdm.MealDay) (mdm.MealDay, error)
	Balance(org string) int64
	GetMeal(id string) (mdm.MealDay, bool)
	ListLedger(mdm.LedgerFilter) []mdm.LedgerEntry
	ListMeals(mdm.MealFilter) []mdm.MealDay
}

func mdmState() mdmStore {
	mdmOnce.Do(func() {
		if dsn := os.Getenv("DATABASE_URL"); dsn != "" {
			if pg, err := newPgMdmStore(dsn); err == nil {
				mdmBack = pg
				log.Printf("mdm: using durable PostgreSQL store (DATABASE_URL set)")
			} else {
				log.Printf("mdm: DATABASE_URL set but PostgreSQL unavailable (%v); using in-memory", err)
				mdmBack = mdm.NewStore()
			}
		} else {
			mdmBack = mdm.NewStore()
		}
		seedMDM(mdmBack)
	})
	return mdmBack
}

// seedMDM plants a fortnight of foodgrain lifting + a few days of meal service at a real Chennai school, sized
// so the stock is healthy but one school can be driven low — enough signal for coverage + days-of-cover
// analytics. Synthetic; no real PII.
func seedMDM(s mdmStore) {
	// Plant the foodgrain ledger + meal service at several schools across more than one district so the
	// PM-POSHAN coverage/days-of-cover roll-up aggregates many schools (and one can be driven low for signal).
	schools := pilotSchools(4)
	if len(schools) == 0 {
		if only := tenancyLeafUnder(pilotDistrict()); only != "" {
			schools = []string{only}
		} else {
			return
		}
	}
	const enrolment = 320
	for si, school := range schools {
		// later schools lift a little less grain so days-of-cover varies across the estate.
		lift := int64(200000 - si*30000)
		s.Receive(mdm.LedgerEntry{ID: fmt.Sprintf("MDM-RCV-2026-06-01-%d", si), OrgUnit: school, Date: "2026-06-01", Kind: mdm.Receipt, GrainGrams: lift, Note: "TPDS lifting"})
		days := []struct {
			date   string
			served int
		}{
			{"2026-06-02", 300 - si*8}, {"2026-06-03", 298 - si*8}, {"2026-06-04", 305 - si*8}, {"2026-06-05", 290 - si*8}, {"2026-06-08", 302 - si*8},
		}
		for _, d := range days {
			grain := int64(d.served) * mdm.GramsPrimary
			s.Serve(mdm.MealDay{
				ID: fmt.Sprintf("MDM-%s-%d", d.date, si), OrgUnit: school, Date: d.date,
				MealsServed: d.served, Enrolment: enrolment, GrainGrams: grain,
			})
		}
	}
}

// ReceiveFoodgrain records a foodgrain receipt at a school (increasing stock). Audited.
func (p *Platform) ReceiveFoodgrain(e mdm.LedgerEntry) (mdm.LedgerEntry, error) {
	out, err := mdmState().Receive(e)
	if err != nil {
		p.appendAudit("mdm-incharge", "mdm.receive.denied", e.OrgUnit, "deny", err.Error())
		return mdm.LedgerEntry{}, err
	}
	p.appendAudit("mdm-incharge", "mdm.receive", e.ID, "executed", fmt.Sprintf("%dg received", e.GrainGrams))
	return out, nil
}

// ServeMeal records a day's meal service (enforcing the stock + enrolment invariants). Audited.
func (p *Platform) ServeMeal(m mdm.MealDay) (mdm.MealDay, error) {
	out, err := mdmState().Serve(m)
	if err != nil {
		p.appendAudit("mdm-incharge", "mdm.serve.denied", m.OrgUnit, "deny", err.Error())
		return mdm.MealDay{}, err
	}
	p.appendAudit("mdm-incharge", "mdm.serve", m.ID, "executed", fmt.Sprintf("%d/%d fed, %dg cooked", m.MealsServed, m.Enrolment, m.GrainGrams))
	return out, nil
}

// SchoolMealRegister returns a school's meal-day records (most recent first).
func (p *Platform) SchoolMealRegister(org string) []mdm.MealDay {
	return mdmState().ListMeals(mdm.MealFilter{OrgUnit: org})
}

// SchoolStock is a school's foodgrain stock picture in the dashboard.
type SchoolStock struct {
	OrgUnit     string `json:"org_unit"`
	BalanceG    int64  `json:"balance_grams"`
	ConsumedG   int64  `json:"consumed_grams"`
	MealDays    int    `json:"meal_days"`
	AvgDailyG   int64  `json:"avg_daily_grams"`
	DaysOfCover int    `json:"days_of_cover"`
	LowStock    bool   `json:"low_stock"`
}

// MDMDashboard is the jurisdiction-scoped PM-POSHAN picture: meal coverage across the schools a node governs,
// total grain consumed, and — the operational signal — the LOW-STOCK roster (schools with fewer than
// lowStockDays of cover left at their recent burn rate). Downward-governance scoped.
type MDMDashboard struct {
	Scope        string        `json:"scope"`
	Schools      int           `json:"schools"`
	MealDays     int           `json:"meal_days"`
	MealsServed  int           `json:"meals_served"`
	Enrolment    int           `json:"enrolment_days"` // sum of per-day enrolment (the coverage denominator)
	CoverageRate float64       `json:"coverage_pct"`
	ConsumedG    int64         `json:"consumed_grams"`
	LowStock     []SchoolStock `json:"low_stock_schools,omitempty"`
	StockRollup  []SchoolStock `json:"stock_rollup,omitempty"`
	Synthetic    bool          `json:"synthetic"`
}

// lowStockDays is the days-of-cover watermark below which a school's foodgrain stock is flagged.
const lowStockDays = 3

// MDMDashboard rolls up meal coverage + foodgrain stock for the schools a tenant node governs.
func (p *Platform) MDMDashboard(scopeOrg string) MDMDashboard {
	d := MDMDashboard{Scope: scopeOrg, Synthetic: true}
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return d
	}
	type acc struct {
		consumed int64
		days     int
	}
	bySchool := map[string]*acc{}
	for _, m := range mdmState().ListMeals(mdm.MealFilter{}) {
		if !h.Governs(scopeOrg, m.OrgUnit) {
			continue
		}
		d.MealDays++
		d.MealsServed += m.MealsServed
		d.Enrolment += m.Enrolment
		d.ConsumedG += m.GrainGrams
		a := bySchool[m.OrgUnit]
		if a == nil {
			a = &acc{}
			bySchool[m.OrgUnit] = a
		}
		a.consumed += m.GrainGrams
		a.days++
	}
	for org, a := range bySchool {
		bal := mdmState().Balance(org)
		ss := SchoolStock{OrgUnit: org, BalanceG: bal, ConsumedG: a.consumed, MealDays: a.days}
		if a.days > 0 {
			ss.AvgDailyG = a.consumed / int64(a.days)
		}
		if ss.AvgDailyG > 0 {
			ss.DaysOfCover = int(bal / ss.AvgDailyG)
		}
		ss.LowStock = ss.AvgDailyG > 0 && ss.DaysOfCover < lowStockDays
		d.StockRollup = append(d.StockRollup, ss)
		if ss.LowStock {
			d.LowStock = append(d.LowStock, ss)
		}
	}
	d.Schools = len(bySchool)
	if d.Enrolment > 0 {
		d.CoverageRate = float64(d.MealsServed) * 100 / float64(d.Enrolment)
	}
	return d
}
