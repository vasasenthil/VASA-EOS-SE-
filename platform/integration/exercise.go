package integration

import (
	"context"
	"fmt"

	"github.com/vasa-eos-se-tn/platform/consent"
	"github.com/vasa-eos-se-tn/platform/onboarding"
)

// EstateExercise is the honest end-to-end result of driving a synthetic cohort through the live platform: each
// student gets a real lawful-basis grant recorded in the §E register, then is run through the full §B.6
// twelve-step onboarding gate (classification → consent → residency → policy → encrypt → persist → audit →
// emit) against the real layers. The counts are observed, not asserted — they are what the platform actually
// did with a populated estate.
type EstateExercise struct {
	Cohort         int            `json:"cohort"`          // synthetic students processed
	GrantsRecorded int            `json:"grants_recorded"` // lawful-basis grants written to the §E register
	Onboarded      int            `json:"onboarded"`       // records that cleared all 12 steps
	Quarantined    int            `json:"quarantined"`     // records the gate held back (not lost)
	ByFailedStep   map[string]int `json:"by_failed_step"`  // quarantine reasons, by the step that caught them
	// downstream workflows driven on the onboarded students (bounded sub-sample)
	Admitted          int `json:"admitted"`           // admission workflows that admitted the applicant
	CredentialsIssued int `json:"credentials_issued"` // verifiable credentials minted + notarised on admit
	TutoringServed    int `json:"tutoring_served"`    // tutor questions answered (grounded + safe)
	TutoringRefused   int `json:"tutoring_refused"`   // tutor questions refused by the safety gate
	Districts         int `json:"districts"`          // distinct real districts touched
	AuditRecords      int `json:"audit_records"`      // immutable audit-chain length after the run
}

// downstreamCap bounds how many onboarded students are also driven through the heavier admission + tutoring
// workflows, so the exercise endpoint stays responsive regardless of cohort size.
const downstreamCap = 500

// ExerciseOnboarding materialises a synthetic cohort across the real institutional estate and drives every
// member through the live onboarding gate. To exercise both the happy path and the fail-closed quarantine
// path honestly, one in twenty records is routed to an offshore region (which the residency step must reject)
// and the rest are TN-resident with a live consent grant. The result reflects real platform behaviour.
func (p *Platform) ExerciseOnboarding(ctx context.Context, cohort int) EstateExercise {
	res := EstateExercise{Cohort: cohort, ByFailedStep: map[string]int{}}
	schools := tree().Schools
	if cohort <= 0 || len(schools) == 0 {
		return res
	}
	// spread the cohort evenly across the whole estate so the run touches the full geography, not just the
	// first district's schools.
	step := len(schools) / cohort
	if step < 1 {
		step = 1
	}
	districts := map[string]bool{}

	for i := 0; i < cohort; i++ {
		sc := schools[(i*step)%len(schools)]
		districts[sc.District] = true
		apaar := fmt.Sprintf("SYN-APAAR-%012d", i+1)
		// record a real DPDP consent grant for this synthetic principal (minor + guardian, AI-tutoring purpose).
		if _, err := p.RecordConsent("EX-"+apaar, apaar, "ai-tutoring", consent.Consent, true, "SYN-PAR-"+fmt.Sprint(i+1)); err == nil {
			res.GrantsRecorded++
		}

		region := "TN-SDC"
		if i%20 == 0 {
			region = "AWS-Mumbai" // offshore → the residency step must quarantine this Class-2 PII
		}
		rec := onboarding.Record{
			// ingestion is per-source (the originating school/block), so the rate-shape step buckets per source
			// rather than throttling one global stream — the realistic federated-ingestion shape.
			ID: apaar, Source: "udise:" + sc.Block, Channel: "estate-exercise", Region: region,
			Signature: []byte("udise-adapter-sig"), // the L4 federation adapter signs verified source records
			Payload: map[string]any{
				"category": "marks", "tenant": "TN/Chennai", "datatype": "row",
				"principal": apaar, "purpose": "ai-tutoring",
			},
		}
		out := p.Onboard(ctx, rec, "DGE")
		if !out.Accepted {
			if out.Quarantined {
				res.Quarantined++
				res.ByFailedStep[string(out.FailedStep)]++
			}
			continue
		}
		res.Onboarded++

		// drive the onboarded student through the rest of the platform (bounded): admission → credential, and
		// an age-appropriate tutoring turn. Rate limiting is keyed per district so the burst is shed realistically.
		if res.Onboarded > downstreamCap {
			continue
		}
		tenant := "TN/" + sc.District
		adm, err := p.Admission(ctx, AdmissionRequest{
			Tenant: tenant, ActorRole: "HEAD_TEACHER", Decision: "admit", ApplicantID: apaar,
			ApplicantName: "Synthetic Learner", ApplicantAge: 6 + i%6, Category: admissionCats[i%len(admissionCats)],
			Region: "TN-SDC",
		})
		if err == nil && adm.Allowed {
			res.Admitted++
			if adm.Credential != nil {
				res.CredentialsIssued++
			}
		}
		tut, err := p.AskTutor(ctx, TutorRequest{
			Tenant: tenant, UserID: apaar, Question: "Explain fractions for Class 4.", AgeAppropriate: true,
			Mastered: map[string]bool{"div": true, "place": true}, Target: "frac",
		})
		if err == nil {
			if tut.Refused {
				res.TutoringRefused++
			} else if tut.Answer != "" {
				res.TutoringServed++
			}
		}
	}
	res.Districts = len(districts)
	res.AuditRecords = p.Audit.Len()
	return res
}

// admissionCats cycles the RTE social categories across the exercised cohort.
var admissionCats = []string{"GEN", "OBC", "SC", "ST", "EWS", "DG"}
