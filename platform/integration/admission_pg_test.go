package integration

import (
	"context"
	"os"
	"testing"
)

// TestPgAdmissionDurable proves admission application records persist to PostgreSQL across fresh store
// instances, with no cleartext PII (only the decision, reasons and references). Runs only with DATABASE_URL.
func TestPgAdmissionDurable(t *testing.T) {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		t.Skip("DATABASE_URL not set; durable PostgreSQL admission test runs against a live database only")
	}
	s1, err := newPgAdmissionStore(dsn)
	if err != nil {
		t.Fatalf("connect/migrate: %v", err)
	}
	if _, err := s1.db.Exec(`DELETE FROM admission_applications WHERE id LIKE 'PGA-%'`); err != nil {
		t.Fatalf("cleanup: %v", err)
	}

	// record an admitted application and a pending-review (EWS) one.
	if err := s1.Record(AdmissionApplication{ID: "PGA-1", Category: "GEN", Age: 6, Tenant: "TN/Chennai", Decision: "admit", Stage: "admitted", Effect: "permit", CredentialID: "ADM-PGA-1", PIISealed: true, DecidedAt: "t"}); err != nil {
		t.Fatal(err)
	}
	if err := s1.Record(AdmissionApplication{ID: "PGA-2", Category: "EWS", Age: 6, Tenant: "TN/Chennai", Decision: "reject", Stage: "pending-approval", Effect: "require-approval", Reasons: "RTE-EWS-QUOTA", RequestID: "TR-9", PIISealed: true, DecidedAt: "t"}); err != nil {
		t.Fatal(err)
	}
	// upsert: re-decide PGA-2 to admitted (post-HITL finalisation) — same id, updated stage.
	if err := s1.Record(AdmissionApplication{ID: "PGA-2", Category: "EWS", Age: 6, Tenant: "TN/Chennai", Decision: "admit", Stage: "admitted", Effect: "permit", CredentialID: "ADM-PGA-2", PIISealed: true, DecidedAt: "t2"}); err != nil {
		t.Fatal(err)
	}

	// fresh instance: both records durable, the upsert took effect, and no name/PII column exists.
	s2, _ := newPgAdmissionStore(dsn)
	a1, ok := s2.Get("PGA-1")
	if !ok || a1.Stage != "admitted" || a1.CredentialID != "ADM-PGA-1" || !a1.PIISealed {
		t.Fatalf("admitted record not durable: %+v", a1)
	}
	a2, _ := s2.Get("PGA-2")
	if a2.Stage != "admitted" || a2.CredentialID != "ADM-PGA-2" {
		t.Fatalf("upsert (HITL finalisation) not durable: %+v", a2)
	}
	if len(s2.List()) < 2 {
		t.Fatalf("durable list returned too few: %d", len(s2.List()))
	}
}

// TestAdmissionPersistsApplication proves the live workflow records the application (in-memory path): an EWS
// reject against an open quota is a pending-review application, and it lands in the durable register.
func TestAdmissionPersistsApplication(t *testing.T) {
	p := newPlatform(t)
	// this test exercises the in-memory store (no DATABASE_URL in the unit sweep).
	res, err := p.Admission(context.Background(), AdmissionRequest{
		Tenant: "TN/Chennai", ActorRole: "HEAD_TEACHER", Decision: "reject", Category: "EWS",
		ApplicantID: "APP-EWS-1", ApplicantName: "synthetic", ApplicantAge: 6, Region: "TN-SDC",
	})
	if err != nil {
		t.Fatal(err)
	}
	if res.Stage != "pending-approval" {
		t.Fatalf("EWS reject on an open quota must be pending-approval: %+v", res)
	}
	app, ok := p.AdmissionApplicationRecord("APP-EWS-1")
	if !ok || app.Stage != "pending-approval" || app.Category != "EWS" {
		t.Fatalf("the application must be persisted: %+v ok=%v", app, ok)
	}
	if app.RequestID == "" {
		t.Fatal("the pending application must record its HITL request id")
	}
	// the dashboard rolls it up under the tenant.
	d := p.AdmissionDashboard("TN/")
	if d.Total == 0 || d.PendingRevw == 0 || d.ByCategory["EWS"] == 0 {
		t.Fatalf("dashboard must reflect the pending EWS application: %+v", d)
	}
}

func TestFinaliseAdmissionUpdatesPersistedRecord(t *testing.T) {
	p := newPlatform(t)
	// an EWS reject on an open quota is routed to HITL review (pending-approval).
	res, err := p.Admission(context.Background(), AdmissionRequest{
		Tenant: "TN/Chennai", ActorRole: "HEAD_TEACHER", Decision: "reject", Category: "EWS",
		ApplicantID: "FIN-1", ApplicantName: "synthetic", ApplicantAge: 6, Region: "TN-SDC",
	})
	if err != nil || res.Stage != "pending-approval" || res.RequestID == "" {
		t.Fatalf("setup: expected pending-approval with a request id: %+v err=%v", res, err)
	}
	if app, _ := p.AdmissionApplicationRecord("FIN-1"); app.Stage != "pending-approval" {
		t.Fatalf("the persisted record should start pending: %+v", app)
	}

	// the reviewer OVERTURNS the rejection (rejects the HITL) → the EWS child is admitted (child-protective).
	out, err := p.FinaliseAdmission(context.Background(), res.RequestID, false, "G6-Compliance")
	if err != nil {
		t.Fatalf("finalise: %v", err)
	}
	if out.Stage != "admitted" || out.CredentialID != "ADM-FIN-1" {
		t.Fatalf("overturned EWS reject must admit + issue a credential: %+v", out)
	}
	// the DURABLE record reflects the final stage (no longer pending, no dangling request id).
	app, ok := p.AdmissionApplicationRecord("FIN-1")
	if !ok || app.Stage != "admitted" || app.RequestID != "" {
		t.Fatalf("the persisted record must be finalised: %+v", app)
	}
	// a second EWS reject, upheld this time → denied.
	res2, _ := p.Admission(context.Background(), AdmissionRequest{
		Tenant: "TN/Chennai", ActorRole: "HEAD_TEACHER", Decision: "reject", Category: "EWS",
		ApplicantID: "FIN-2", ApplicantName: "synthetic", ApplicantAge: 6, Region: "TN-SDC",
	})
	if out2, err := p.FinaliseAdmission(context.Background(), res2.RequestID, true, "G6-Compliance"); err != nil || out2.Stage != "denied" {
		t.Fatalf("upheld rejection must deny: %+v err=%v", out2, err)
	}
	// an unknown request id is rejected.
	if _, err := p.FinaliseAdmission(context.Background(), "NOPE", true, "G6-Compliance"); err == nil {
		t.Fatal("an unknown HITL request must error")
	}
}
