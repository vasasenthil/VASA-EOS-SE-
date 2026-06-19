package integration

import (
	"context"
	"strings"
	"testing"

	"github.com/vasa-eos-se-tn/platform/i18n"
	"github.com/vasa-eos-se-tn/platform/workflow"
)

func TestAdmissionDispatchesTamilNotification(t *testing.T) {
	p := newPlatform(t)
	_, err := p.Admission(context.Background(), AdmissionRequest{
		Tenant: "TN/Chennai", ActorRole: "HEAD_TEACHER", Decision: "admit",
		ApplicantID: "STU-1", ApplicantName: "Anbu", ApplicantAge: 7, Category: "GEN", Region: "TN-SDC",
	})
	if err != nil {
		t.Fatal(err)
	}
	inbox := p.Notifications("role:HEAD_TEACHER")
	if len(inbox) != 1 {
		t.Fatalf("admit should dispatch one inbox notification, got %d", len(inbox))
	}
	// default locale is Tamil → the body is the Tamil template with the id interpolated
	if !strings.Contains(inbox[0].Body, "STU-1") || !strings.Contains(inbox[0].Body, "சான்றிதழ்") {
		t.Fatalf("notification should be the localised (Tamil) admitted message: %q", inbox[0].Body)
	}
}

func TestEWSReviewNotification(t *testing.T) {
	p := newPlatform(t)
	p.Admission(context.Background(), AdmissionRequest{
		Tenant: "TN/Chennai", ActorRole: "HEAD_TEACHER", Decision: "reject",
		ApplicantID: "STU-2", ApplicantAge: 7, Category: "EWS", Region: "TN-SDC",
	})
	inbox := p.Notifications("role:HEAD_TEACHER")
	if len(inbox) != 1 || inbox[0].Key != "admission.review" {
		t.Fatalf("EWS reject should dispatch a review notification, got %+v", inbox)
	}
}

func TestNotificationIdempotentAcrossRetries(t *testing.T) {
	p := newPlatform(t)
	req := AdmissionRequest{Tenant: "TN/Chennai", ActorRole: "HEAD_TEACHER", Decision: "admit", ApplicantID: "STU-1", ApplicantName: "A", ApplicantAge: 7, Category: "GEN", Region: "TN-SDC"}
	p.Admission(context.Background(), req)
	p.Admission(context.Background(), req) // retried (same applicant/stage)
	if n := len(p.Notifications("role:HEAD_TEACHER")); n != 1 {
		t.Fatalf("a retried admission must not double-notify; got %d", n)
	}
}

func TestI18nCoverageSurfaced(t *testing.T) {
	p := newPlatform(t)
	// the seeded catalogue translates every English admission key into Tamil → full coverage
	if cov := p.I18n.Coverage(i18n.Ta); cov != 1 {
		t.Fatalf("Tamil should fully cover the seeded keys, got %v (missing %v)", cov, p.I18n.Missing(i18n.Ta))
	}
}

func TestSanctionWorkflowG3toG7(t *testing.T) {
	p := newPlatform(t)
	in, err := p.StartSanction("WF-NMMS-1")
	if err != nil {
		t.Fatal(err)
	}
	tiers := []struct{ role, scope string }{
		{"DEO", "scheme.recommend"},
		{"DIRECTOR", "scheme.approve"},
		{"SECRETARY", "fund.release"},
	}
	for _, tr := range tiers {
		if err := p.ActSanction(in, workflow.Approve, tr.role+"-1", tr.role, []string{tr.scope}, ""); err != nil {
			t.Fatalf("%s approve: %v", tr.role, err)
		}
	}
	if in.Status != workflow.Approved {
		t.Fatalf("after G3→G5→G7 approve, the sanction should be approved, got %s", in.Status)
	}
	// a wrong-tier actor cannot act on a completed instance
	if err := p.ActSanction(in, workflow.Approve, "x", "DEO", []string{"*"}, ""); err == nil {
		t.Fatal("acting on a completed sanction must error")
	}
}

func TestSanctionRejectStops(t *testing.T) {
	p := newPlatform(t)
	in, _ := p.StartSanction("WF-2")
	p.ActSanction(in, workflow.Approve, "deo", "DEO", []string{"scheme.recommend"}, "")
	if err := p.ActSanction(in, workflow.Reject, "dir", "DIRECTOR", []string{"scheme.approve"}, "docs missing"); err != nil {
		t.Fatal(err)
	}
	if in.Status != workflow.Rejected {
		t.Fatalf("a tier rejection must stop the sanction, got %s", in.Status)
	}
}
