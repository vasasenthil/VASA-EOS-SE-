package integration

import (
	"os"
	"testing"

	"github.com/vasa-eos-se-tn/platform/rbsk"
)

// TestPgRbskDurable proves RBSK screenings + the referral pipeline persist to PostgreSQL across fresh store
// instances. Runs only with DATABASE_URL set.
func TestPgRbskDurable(t *testing.T) {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		t.Skip("DATABASE_URL not set; durable PostgreSQL RBSK test runs against a live database only")
	}
	s1, err := newPgRbskStore(dsn)
	if err != nil {
		t.Fatalf("connect/migrate: %v", err)
	}
	if _, err := s1.db.Exec(`DELETE FROM rbsk_screenings WHERE id LIKE 'PGR-%'`); err != nil {
		t.Fatalf("cleanup: %v", err)
	}

	// a deficiency + disability finding → auto-referred to the DEIC (durable).
	sc, err := s1.File("PGR-1", "STU-9", "33000000001", "2026-06-05", []string{rbsk.Deficiency, rbsk.Disability})
	if err != nil || sc.Status != rbsk.Referred || sc.ReferredTo != rbsk.DEIC {
		t.Fatalf("file: %+v err=%v", sc, err)
	}
	// a healthy screening (durable, no referral).
	if _, err := s1.File("PGR-2", "STU-10", "33000000001", "2026-06-05", nil); err != nil {
		t.Fatalf("healthy file: %v", err)
	}

	// fresh instance: findings (JSONB) + status durable.
	s2, _ := newPgRbskStore(dsn)
	got, ok := s2.Get("PGR-1")
	if !ok || len(got.Findings) != 2 || got.Status != rbsk.Referred {
		t.Fatalf("findings not durable: %+v", got)
	}
	// advance the referral: treat then close, across fresh instances.
	if _, err := s2.Treat("PGR-1"); err != nil {
		t.Fatalf("treat: %v", err)
	}
	s3, _ := newPgRbskStore(dsn)
	if g, _ := s3.Get("PGR-1"); g.Status != rbsk.UnderTreatment {
		t.Fatalf("treatment not durable: %+v", g)
	}
	if _, err := s3.Close("PGR-1", "supplements + DEIC follow-up scheduled"); err != nil {
		t.Fatalf("close: %v", err)
	}
	s4, _ := newPgRbskStore(dsn)
	fin, _ := s4.Get("PGR-1")
	if fin.Status != rbsk.Closed || fin.ClosedOutcome == "" {
		t.Fatalf("closure not durable: %+v", fin)
	}
}

// TestRBSKDashboardScoped proves the seeded screening camp rolls up + tracks referrals (in-memory path).
func TestRBSKDashboardScoped(t *testing.T) {
	p := newPlatform(t)
	d := p.RBSKDashboard("TN-DIST-Chennai")
	if d.Screened == 0 {
		t.Fatalf("the seeded screening camp must roll up: %+v", d)
	}
	if d.WithFindings == 0 || len(d.ByFinding) == 0 {
		t.Fatalf("some students must have findings (auto-referred): %+v", d)
	}
	if d.ActiveReferrals == 0 {
		t.Fatalf("there must be active referrals to follow up: %+v", d)
	}
	if d.Healthy+d.WithFindings != d.Screened {
		t.Fatalf("healthy + with-findings must equal screened: %+v", d)
	}
	// the referral worklist is non-empty and downward-scoped.
	if len(p.RBSKReferralsScopedBy("TN-DIST-Chennai")) == 0 {
		t.Fatal("the referral worklist must list the active referrals")
	}
	// unknown scope → nothing.
	if u := p.RBSKDashboard("TN-DIST-Nowhere"); u.Screened != 0 {
		t.Fatalf("unknown scope must see nothing: %+v", u)
	}
}
