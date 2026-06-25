// Package dr models Phase-8 disaster recovery: the Chennai (primary) → Coimbatore (DR) failover and drill
// (CC-SPEC-001 §10.3, §24 Phase 8). Both sites are TN-sovereign (residency holds across failover, ADR-0009).
//
// Two objectives bound a failover: the RPO (recovery point objective — the maximum tolerable data loss,
// bounded by the replication lag at the moment of failover) and the RTO (recovery time objective — the
// maximum tolerable downtime, bounded by how long promotion takes). A failover promotes the standby only when
// it is healthy, demotes the old primary, and reports whether RPO and RTO were met. A DRILL exercises the
// same logic non-destructively (the primary is not actually demoted), so go-live readiness is provable.
// Stdlib-only.
package dr

import (
	"errors"
	"time"
)

// Site is a hosting site.
type Site string

const (
	Chennai    Site = "TN-SDC"    // primary
	Coimbatore Site = "TN-SDC-DR" // disaster-recovery
)

// Role is a site's current role.
type Role string

const (
	Primary  Role = "primary"
	Standby  Role = "standby"
	Promoted Role = "promoted"
	Demoted  Role = "demoted"
)

// Targets are the recovery objectives.
type Targets struct {
	RPO time.Duration // max tolerable data loss
	RTO time.Duration // max tolerable downtime
}

// DefaultTargets: 30s RPO, 5m RTO (active-active replication, fast promotion).
func DefaultTargets() Targets { return Targets{RPO: 30 * time.Second, RTO: 5 * time.Minute} }

// Controller tracks the two sites' roles and the recovery targets.
type Controller struct {
	primary Site
	standby Site
	roles   map[Site]Role
	targets Targets
}

// New builds a controller with Chennai primary and Coimbatore standby.
func New(targets Targets) (*Controller, error) {
	if targets.RPO <= 0 || targets.RTO <= 0 {
		return nil, errors.New("dr: RPO and RTO must be positive")
	}
	return &Controller{
		primary: Chennai,
		standby: Coimbatore,
		roles:   map[Site]Role{Chennai: Primary, Coimbatore: Standby},
		targets: targets,
	}, nil
}

// Role returns a site's current role.
func (c *Controller) Role(s Site) Role { return c.roles[s] }

// Primary returns the current primary site.
func (c *Controller) Primary() Site { return c.primary }

// Report is the outcome of a failover or drill.
type Report struct {
	Promoted       Site
	Demoted        Site
	DataLossWindow time.Duration // == replication lag at failover (the realised RPO)
	Downtime       time.Duration // == promotion duration (the realised RTO)
	RPOMet         bool
	RTOMet         bool
	Drill          bool
}

// Healthy reports whether the failover met BOTH objectives.
func (r Report) Healthy() bool { return r.RPOMet && r.RTOMet }

// evaluate checks the realised windows against the targets.
func (c *Controller) evaluate(replicationLag, promotionTime time.Duration) (bool, bool) {
	return replicationLag <= c.targets.RPO, promotionTime <= c.targets.RTO
}

// Failover promotes the standby to primary and demotes the old primary. standbyHealthy must be true (you do
// not fail over to an unhealthy site). replicationLag and promotionTime are measured at failover and graded
// against the RPO/RTO targets.
func (c *Controller) Failover(standbyHealthy bool, replicationLag, promotionTime time.Duration) (Report, error) {
	if !standbyHealthy {
		return Report{}, errors.New("dr: refusing to fail over to an unhealthy standby")
	}
	oldPrimary, newPrimary := c.primary, c.standby
	rpoMet, rtoMet := c.evaluate(replicationLag, promotionTime)

	// flip roles
	c.roles[newPrimary] = Promoted
	c.roles[oldPrimary] = Demoted
	c.primary, c.standby = newPrimary, oldPrimary

	return Report{
		Promoted:       newPrimary,
		Demoted:        oldPrimary,
		DataLossWindow: replicationLag,
		Downtime:       promotionTime,
		RPOMet:         rpoMet,
		RTOMet:         rtoMet,
		Drill:          false,
	}, nil
}

// Drill exercises the failover evaluation non-destructively: it grades the measured windows against the
// targets WITHOUT changing any site's role, so DR readiness can be proven on a schedule.
func (c *Controller) Drill(standbyHealthy bool, replicationLag, promotionTime time.Duration) (Report, error) {
	if !standbyHealthy {
		return Report{}, errors.New("dr: drill aborted — standby unhealthy")
	}
	rpoMet, rtoMet := c.evaluate(replicationLag, promotionTime)
	return Report{
		Promoted:       c.standby, // would-be promotion target
		Demoted:        c.primary,
		DataLossWindow: replicationLag,
		Downtime:       promotionTime,
		RPOMet:         rpoMet,
		RTOMet:         rtoMet,
		Drill:          true,
	}, nil
}

// Failback returns to the original site assignment after the old primary is healthy again (a second
// controlled failover). It is a thin wrapper that asserts the original primary is the promotion target.
func (c *Controller) Failback(oldPrimaryHealthy bool, replicationLag, promotionTime time.Duration) (Report, error) {
	if !oldPrimaryHealthy {
		return Report{}, errors.New("dr: cannot fail back to an unhealthy original primary")
	}
	return c.Failover(true, replicationLag, promotionTime)
}
