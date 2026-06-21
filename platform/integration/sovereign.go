package integration

import (
	"errors"
	"os"
)

// errADenied is returned when a non-super-admin attempts a sovereign action.
var errADenied = errors.New("integration: not authorised (super-admin / T0 sovereign only)")

// superAdminRoles are the roles permitted to view the Sovereign Console — the T0 sovereign operator surface.
// In production this is enforced by the PEP/IAM (Keycloak, gated B-010); here it is an explicit role gate.
var superAdminRoles = map[string]bool{
	"SUPERADMIN": true, // the State's sovereign platform operator (T0)
	"SECRETARY":  true, // School Education Secretary
	"MINISTER":   true, // Hon'ble Minister / CM
}

// IsSuperAdmin reports whether a role may operate the sovereign console.
func IsSuperAdmin(role string) bool { return superAdminRoles[role] }

// SovereignConsole is the T0 super-admin operating picture of the ENTIRE platform: the off-switch state, the
// live conformance self-check, the tenancy estate, federation, the SLA board, the civic backlog, and the
// tamper-evidence counters — everything the sovereign operator needs to answer "is the whole platform fit,
// conformant and under control right now?". It is role-gated (T0 sovereign only).
type SovereignConsole struct {
	Sovereign         string       `json:"sovereign"`
	Authorised        bool         `json:"authorised"`
	OffSwitchEngaged  bool         `json:"off_switch_engaged"`
	GoLiveReady       bool         `json:"go_live_ready"`
	HeadlinesMatch    bool         `json:"conformance_headlines_match"`
	Layers            int          `json:"layers"`
	GovernanceTiers   int          `json:"governance_tiers"`
	TenancyNodes      int          `json:"tenancy_nodes"`
	TenancyValid      bool         `json:"tenancy_valid"`
	Schools           int          `json:"schools"`
	Engines           int          `json:"engines"`
	Agents            int          `json:"agents"`
	Portals           int          `json:"portals"`
	FunctionalModules int          `json:"functional_modules"`
	NDEAR             string       `json:"ndears_addressed"`
	ModelCardCoverage float64      `json:"model_card_coverage"`
	SLABoard          []SLAStatus  `json:"sla_board"`
	Civic             civicSummary `json:"civic"`
	AuditRecords      int          `json:"audit_records"`
	NotaryBlocks      int          `json:"notary_blocks"`
	AuditChainIntact  bool         `json:"audit_chain_intact"`
	Operations        opsSummary   `json:"operations"`
}

// opsSummary is the live operating state of the durable workflow verticals — what is actually happening on the
// platform right now (not just whether it is conformant). Durable is true when a database is configured (the
// counts are persisted and survive restarts) and false for the in-memory demo.
type opsSummary struct {
	Durable           bool `json:"durable"`
	Admissions        int  `json:"admissions"`
	AdmissionsPending int  `json:"admissions_pending_review"`
	GrievanceCases    int  `json:"grievance_cases"`
	GrievanceOverdue  int  `json:"grievance_overdue"`
	LeaveRequests     int  `json:"leave_requests"`
	LeavePending      int  `json:"leave_pending"`
	ExamSheets        int  `json:"exam_sheets"`
	CalendarEntries   int  `json:"calendar_entries"`
	DirectoryUsers    int  `json:"directory_users"`
}

// operationsSummary rolls up the durable workflow verticals for the sovereign operating picture. Read-only.
func (p *Platform) operationsSummary() opsSummary {
	adm := p.AdmissionDashboard("")
	gr := p.GrievanceCaseDashboard("TN")
	return opsSummary{
		Durable:           os.Getenv("DATABASE_URL") != "",
		Admissions:        adm.Total,
		AdmissionsPending: adm.PendingRevw,
		GrievanceCases:    gr.Total,
		GrievanceOverdue:  gr.Overdue,
		LeaveRequests:     len(p.LeaveScopedBy("TN", "")),
		LeavePending:      len(p.LeaveScopedBy("TN", "pending")),
		ExamSheets:        p.ExamResultsDashboard("TN").Sheets,
		CalendarEntries:   len(p.CalendarEntries("TN", "", "")),
		DirectoryUsers:    p.DirectorySummary().Users,
	}
}

// civicSummary mirrors the civic roll-up the console surfaces (avoids importing the civic type into the API).
type civicSummary struct {
	GrievancesOpen     int `json:"grievances_open"`
	GrievancesResolved int `json:"grievances_resolved"`
	RTIOpen            int `json:"rti_open"`
	RTIOverdue         int `json:"rti_overdue"`
}

// SovereignConsole assembles the whole-platform operating picture for a super-admin actor. A non-super-admin
// gets an unauthorised, empty console (fail-closed).
func (p *Platform) SovereignConsole(actorRole string) SovereignConsole {
	c := SovereignConsole{Sovereign: "Tamil Nadu (T0 Sovereign)"}
	if !IsSuperAdmin(actorRole) {
		return c // Authorised stays false; nothing is disclosed
	}
	c.Authorised = true

	h, _ := p.Health()
	c.OffSwitchEngaged = h.Disabled

	conf := p.Conformance()
	c.HeadlinesMatch = conf.HeadlinesMatch
	byArea := map[string]int{}
	for _, it := range conf.Items {
		byArea[it.Area] = it.Live
	}
	c.Layers = byArea["Architecture layers (L1–L12)"]
	c.GovernanceTiers = byArea["Governance tiers (G1–G7)"]
	c.Engines = byArea["AI engines"]
	c.Agents = byArea["AI agents"]
	c.Portals = byArea["Stakeholder portals"]
	c.FunctionalModules = byArea["Functional modules"]

	ten := p.TenancySummary()
	c.TenancyNodes, c.TenancyValid = ten.Nodes, ten.Valid
	c.Schools = ten.TierCounts[6]

	c.NDEAR = p.NDEARSummary().Headline
	c.ModelCardCoverage = p.ModelCardCoverage()
	c.SLABoard = p.SLABoard()

	cv := p.CivicSummary()
	c.Civic = civicSummary{GrievancesOpen: cv.GrievOpen, GrievancesResolved: cv.GrievResolved, RTIOpen: cv.RTIOpen, RTIOverdue: cv.RTIOverdue}

	c.AuditRecords = p.Audit.Len()
	c.NotaryBlocks = p.Notary.Len()
	_, err := p.Audit.Verify()
	c.AuditChainIntact = err == nil

	c.Operations = p.operationsSummary()

	// go-live readiness without re-running the heavy capacity drill: conformant + tenancy-valid + chain-intact
	// + not disabled is the console's headline readiness signal.
	c.GoLiveReady = c.HeadlinesMatch && c.TenancyValid && c.AuditChainIntact && !c.OffSwitchEngaged
	return c
}

// SovereignDisable engages the off-switch — a super-admin-only action (the T0 kill-switch). Audited.
func (p *Platform) SovereignDisable(actorRole, requestID string) (bool, error) {
	if !IsSuperAdmin(actorRole) {
		p.appendAudit("role:"+actorRole, "offswitch.engage.denied", "platform", "deny", "not a super-admin")
		return false, errADenied
	}
	ok, err := p.Disable(requestID)
	p.appendAudit("role:"+actorRole, "offswitch.engage", "platform", boolEffect(ok), requestID)
	return ok, err
}

// SovereignEnable disengages the off-switch — a super-admin-only action. Audited.
func (p *Platform) SovereignEnable(actorRole, requestID string) (bool, error) {
	if !IsSuperAdmin(actorRole) {
		p.appendAudit("role:"+actorRole, "offswitch.disengage.denied", "platform", "deny", "not a super-admin")
		return false, errADenied
	}
	ok, err := p.Enable(requestID)
	p.appendAudit("role:"+actorRole, "offswitch.disengage", "platform", boolEffect(ok), requestID)
	return ok, err
}

func boolEffect(ok bool) string {
	if ok {
		return "executed"
	}
	return "pending"
}
