package directory

// This file is the unified Policy Decision Point (PDP): one engine that composes all FIVE access models over a
// directory User and produces an explainable Decision. Each model has a distinct, decisive role:
//
//   RBAC  — does the user's role grant the action verb?              (Engine.grants)
//   ABAC  — do subject/resource attributes forbid it?                (suspended · sensitive · pii · cadre)
//   ReBAC — does the user's org unit GOVERN the resource's org unit?  (injected Governs — downward governance)
//   PBAC  — does statute gate the action behind human approval?      (high-stakes: fund/scheme/policy/audit)
//   CABAC — is this an elevated action allowed only in an emergency?  (override:lockdown · declare:emergency)
//
// Composition is deny-wins and fail-closed: anything not affirmatively permitted is denied. The Decision
// carries a per-model Trace so the Access Explorer can show exactly why an action was permitted, denied, or
// routed to approval.

// Resource is the thing being accessed. OrgUnit (if set) makes it jurisdiction-scoped (ReBAC); Attributes
// drive ABAC (e.g. {"sensitive":"true","pii":"true"}).
type Resource struct {
	ID         string            `json:"id,omitempty"`
	OrgUnit    string            `json:"org_unit,omitempty"`
	Attributes map[string]string `json:"attributes,omitempty"`
}

// Context carries the environment/CABAC signals at decision time.
type Context struct {
	Emergency   bool   `json:"emergency"`
	ThreatLevel string `json:"threat_level,omitempty"` // "", "low", "high"
}

// ModelEval is one access model's verdict, for the explainable trace.
type ModelEval struct {
	Model   string `json:"model"`   // RBAC | ABAC | ReBAC | PBAC | CABAC
	Verdict string `json:"verdict"` // permit | deny | require-approval | n/a
	Detail  string `json:"detail"`
}

// Decision is the composed PDP outcome.
type Decision struct {
	Effect        string      `json:"effect"`         // permit | deny | require-approval
	DecidingModel string      `json:"deciding_model"` // which model determined the effect
	Reason        string      `json:"reason"`
	Trace         []ModelEval `json:"trace"` // every model's verdict, in evaluation order
}

// Permitted is a convenience for the common allow/deny check.
func (d Decision) Permitted() bool { return d.Effect == "permit" }

// denyRule is one statutory PBAC rule. ApprovalActions are gated behind human sign-off rather than denied.
type pbacRule struct {
	action  string
	statute string
}

// highStakes are the actions statute routes to human approval (PFMS/GFR fund release; scheme sanction; policy
// adoption; audit sign-off). RBAC may grant them, but the PDP returns require-approval, never a silent permit.
func highStakes() map[string]pbacRule {
	return map[string]pbacRule{
		"release:fund":    {"release:fund", "PFMS/GFR 2017 — fund release requires sanctioning-authority approval"},
		"sanction:scheme": {"sanction:scheme", "TN Financial Code — scheme sanction requires Empowered-Committee approval"},
		"adopt:policy":    {"adopt:policy", "Cabinet rules — State policy adoption requires Cabinet ratification"},
		"sign:audit":      {"sign:audit", "CAG mandate — audit sign-off is recorded and binding"},
	}
}

// elevatedActions are the CABAC context-gated actions: permitted ONLY inside an emergency window and never at
// high threat level (you do not loosen controls while actively under attack).
func elevatedActions() map[string]bool {
	return map[string]bool{
		"override:lockdown": true,
		"declare:emergency": true,
	}
}

// Engine is the unified PDP. It owns the role grants, the statutory + context rule sets, and an injected
// Governs predicate for ReBAC (subjectOrg governs resourceOrg). Construct via NewEngine.
type Engine struct {
	grants   map[string][]string
	elevated map[string]bool
	stakes   map[string]pbacRule
	governs  func(subjectOrg, resourceOrg string) bool
}

// NewEngine builds the PDP over the role catalogue with an injected ReBAC Governs predicate. If governs is nil
// the engine treats jurisdiction as failing closed for every scoped resource (deny).
func NewEngine(governs func(subjectOrg, resourceOrg string) bool) *Engine {
	grants := map[string][]string{}
	for _, r := range Roles() {
		grants[r.Code] = r.Grants
	}
	if governs == nil {
		governs = func(string, string) bool { return false }
	}
	return &Engine{grants: grants, elevated: elevatedActions(), stakes: highStakes(), governs: governs}
}

// rbacGrants reports whether the user's role grants the action (wildcard "*" grants all).
func (e *Engine) rbacGrants(role, action string) bool {
	for _, g := range e.grants[role] {
		if g == "*" || g == action {
			return true
		}
	}
	return false
}

// abacDeny applies the enforced attribute rules and, if one fires, returns its rationale.
func (e *Engine) abacDeny(u User, action string, r Resource) (bool, string) {
	if u.Suspended {
		return true, "subject attribute suspended=true — access withdrawn regardless of role"
	}
	// marks/attendance entry is restricted to the teaching cadre (a subject attribute gate).
	if action == "write:assessment" || action == "write:attendance" {
		if u.Attributes["cadre"] != "teaching" {
			return true, "ABAC cadre gate — marks/attendance entry is restricted to the teaching cadre"
		}
	}
	if r.Attributes["sensitive"] == "true" && (u.Role == "CITIZEN" || u.Role == "VENDOR") {
		return true, "resource attribute sensitive=true is not disclosable to a public/partner subject"
	}
	if r.Attributes["pii"] == "true" && u.Role == "RESEARCHER" {
		return true, "resource attribute pii=true — a researcher may access anonymised data only (DPDP 2023)"
	}
	return false, ""
}

// Evaluate runs the unified five-model PDP and returns an explainable Decision.
func (e *Engine) Evaluate(u User, action string, r Resource, ctx Context) Decision {
	var trace []ModelEval
	add := func(model, verdict, detail string) { trace = append(trace, ModelEval{model, verdict, detail}) }

	// ── RBAC ──
	rbacOK := e.rbacGrants(u.Role, action)
	if rbacOK {
		add("RBAC", "permit", "role "+u.Role+" grants "+action)
	} else {
		add("RBAC", "deny", "role "+u.Role+" does not grant "+action)
	}

	// ── ABAC ──
	abacBad, abacWhy := e.abacDeny(u, action, r)
	if abacBad {
		add("ABAC", "deny", abacWhy)
	} else {
		add("ABAC", "permit", "no attribute rule forbids the request")
	}

	// ── ReBAC ──
	rebacVerdict, rebacWhy := "n/a", "resource is not jurisdiction-scoped"
	rebacOK := true
	if r.OrgUnit != "" {
		if e.governs(u.OrgUnit, r.OrgUnit) {
			rebacVerdict, rebacWhy = "permit", u.OrgUnit+" governs "+r.OrgUnit+" (downward governance)"
		} else {
			rebacVerdict, rebacWhy, rebacOK = "deny", u.OrgUnit+" does not govern "+r.OrgUnit+" — out of jurisdiction", false
		}
	}
	add("ReBAC", rebacVerdict, rebacWhy)

	// ── PBAC ──
	stake, isStake := e.stakes[action]
	if isStake {
		add("PBAC", "require-approval", stake.statute)
	} else {
		add("PBAC", "n/a", "no statutory approval gate on "+action)
	}

	// ── CABAC ──
	isElevated := e.elevated[action]
	cabacPermit := false
	switch {
	case !isElevated:
		add("CABAC", "n/a", action+" is not a context-elevated action")
	case ctx.Emergency && ctx.ThreatLevel != "high":
		cabacPermit = true
		add("CABAC", "permit", "elevated action authorised inside the emergency window")
	default:
		add("CABAC", "deny", "elevated action requires an active emergency window (and not high threat)")
	}

	// ── composition (deny-wins, fail-closed) ──
	// CABAC governs elevated actions outright: context, not the standing role, decides them.
	if isElevated {
		if cabacPermit && rbacOK {
			return Decision{"permit", "CABAC", "elevated action authorised by emergency context", trace}
		}
		if !rbacOK {
			return Decision{"deny", "RBAC", "role " + u.Role + " is not entitled to the elevated action " + action, trace}
		}
		return Decision{"deny", "CABAC", "elevated action denied outside an emergency window", trace}
	}
	if abacBad {
		return Decision{"deny", "ABAC", abacWhy, trace}
	}
	if !rbacOK {
		return Decision{"deny", "RBAC", "role " + u.Role + " does not grant " + action, trace}
	}
	if !rebacOK {
		return Decision{"deny", "ReBAC", rebacWhy, trace}
	}
	if isStake {
		return Decision{"require-approval", "PBAC", stake.statute, trace}
	}
	return Decision{"permit", "RBAC", "granted by role and within jurisdiction", trace}
}

// Explain resolves a user by ID from the directory and evaluates the request, so callers can verify any
// decision by user (the reverse "why can/can't this person do X" lookup). Returns ok=false if unknown.
func (e *Engine) Explain(d *Directory, userID, action string, r Resource, ctx Context) (Decision, User, bool) {
	u, ok := d.Get(userID)
	if !ok {
		return Decision{}, User{}, false
	}
	return e.Evaluate(u, action, r, ctx), u, true
}
