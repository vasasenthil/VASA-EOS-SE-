package integration

import (
	"os"
	"testing"

	"github.com/vasa-eos-se-tn/platform/mdm"
)

// TestPgMdmDurable proves foodgrain stock + the meal register persist across fresh instances, the
// stock-non-negative invariant is enforced durably (and atomically with the draw-down), and a re-serve corrects
// the balance idempotently. Runs only with DATABASE_URL set.
func TestPgMdmDurable(t *testing.T) {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		t.Skip("DATABASE_URL not set; durable PostgreSQL MDM test runs against a live database only")
	}
	s1, err := newPgMdmStore(dsn)
	if err != nil {
		t.Fatalf("connect/migrate: %v", err)
	}
	if _, err := s1.db.Exec(`DELETE FROM mdm_ledger WHERE org_unit='PGM-SCH'`); err != nil {
		t.Fatalf("cleanup ledger: %v", err)
	}
	if _, err := s1.db.Exec(`DELETE FROM mdm_meals WHERE org_unit='PGM-SCH'`); err != nil {
		t.Fatalf("cleanup meals: %v", err)
	}
	rcv := func(id string, g int64) mdm.LedgerEntry {
		return mdm.LedgerEntry{ID: id, OrgUnit: "PGM-SCH", Date: "2026-06-01", Kind: mdm.Receipt, GrainGrams: g, Note: "lifting"}
	}
	ml := func(id string, served, enrol int, g int64) mdm.MealDay {
		return mdm.MealDay{ID: id, OrgUnit: "PGM-SCH", Date: "2026-06-02", MealsServed: served, Enrolment: enrol, GrainGrams: g}
	}

	if _, err := s1.Receive(rcv("PGM-R1", 50000)); err != nil { // 50 kg
		t.Fatalf("receive: %v", err)
	}
	if _, err := s1.Serve(ml("PGM-M1", 300, 320, 30000)); err != nil { // -30 kg → 20 kg
		t.Fatalf("serve: %v", err)
	}
	if s1.Balance("PGM-SCH") != 20000 {
		t.Fatalf("balance after serve wrong: %d", s1.Balance("PGM-SCH"))
	}
	// a day needing 25 kg with only 20 kg left → rejected (durable leakage gate).
	if _, err := s1.Serve(ml("PGM-M2", 250, 320, 25000)); err == nil {
		t.Fatal("serving more grain than durable stock must be rejected")
	}

	// fresh instance: stock + meal durable, invariant still enforced.
	s2, _ := newPgMdmStore(dsn)
	if s2.Balance("PGM-SCH") != 20000 {
		t.Fatalf("durable balance wrong: %d", s2.Balance("PGM-SCH"))
	}
	if m, ok := s2.GetMeal("PGM-M1"); !ok || m.MealsServed != 300 {
		t.Fatalf("meal not durable: %+v", m)
	}
	if _, err := s2.Serve(ml("PGM-M2", 250, 320, 25000)); err == nil {
		t.Fatal("the stock gate must persist across instances")
	}
	// correct PGM-M1 down to 20 kg cooked → balance recomputes to 30 kg (no double-deduct), durable.
	if _, err := s2.Serve(ml("PGM-M1", 200, 320, 20000)); err != nil {
		t.Fatalf("correction: %v", err)
	}
	s3, _ := newPgMdmStore(dsn)
	if s3.Balance("PGM-SCH") != 30000 {
		t.Fatalf("idempotent correction balance wrong, want 30kg: %d", s3.Balance("PGM-SCH"))
	}
	// now 25 kg fits.
	if _, err := s3.Serve(ml("PGM-M2", 250, 320, 25000)); err != nil {
		t.Fatalf("serve within restored stock: %v", err)
	}
	if s3.Balance("PGM-SCH") != 5000 {
		t.Fatalf("final balance wrong, want 5kg: %d", s3.Balance("PGM-SCH"))
	}
}

// TestMDMDashboardScoped proves the seeded meal register rolls up coverage + foodgrain stock (in-memory path).
func TestMDMDashboardScoped(t *testing.T) {
	p := newPlatform(t)
	d := p.MDMDashboard("TN-DIST-Chennai")
	if d.Schools == 0 || d.MealDays == 0 || d.MealsServed == 0 {
		t.Fatalf("seeded MDM must roll up: %+v", d)
	}
	if d.CoverageRate <= 0 || d.CoverageRate > 100 {
		t.Fatalf("coverage must be a sane percentage: %v", d.CoverageRate)
	}
	if d.ConsumedG == 0 || len(d.StockRollup) == 0 {
		t.Fatalf("grain consumption + stock rollup must be computed: %+v", d)
	}
	// a school's meal register is non-empty.
	if len(p.SchoolMealRegister(d.StockRollup[0].OrgUnit)) == 0 {
		t.Fatal("a seeded school must have a meal register")
	}
	// unknown scope → nothing (fail-closed).
	if u := p.MDMDashboard("TN-DIST-Nowhere"); u.Schools != 0 {
		t.Fatalf("unknown scope must see nothing: %+v", u)
	}
}
