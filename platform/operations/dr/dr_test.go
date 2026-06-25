package dr

import (
	"testing"
	"time"
)

func mustController(t *testing.T) *Controller {
	t.Helper()
	c, err := New(DefaultTargets())
	if err != nil {
		t.Fatal(err)
	}
	return c
}

func TestInitialRoles(t *testing.T) {
	c := mustController(t)
	if c.Primary() != Chennai || c.Role(Chennai) != Primary || c.Role(Coimbatore) != Standby {
		t.Fatal("Chennai should start primary, Coimbatore standby")
	}
}

func TestFailoverPromotesAndMeetsObjectives(t *testing.T) {
	c := mustController(t)
	// lag 10s (< 30s RPO), promotion 2m (< 5m RTO) → both met
	r, err := c.Failover(true, 10*time.Second, 2*time.Minute)
	if err != nil {
		t.Fatal(err)
	}
	if !r.Healthy() {
		t.Fatalf("failover should meet RPO+RTO: %+v", r)
	}
	if r.Promoted != Coimbatore || r.Demoted != Chennai {
		t.Fatalf("Coimbatore should be promoted, Chennai demoted: %+v", r)
	}
	if c.Primary() != Coimbatore {
		t.Fatal("primary should now be Coimbatore")
	}
	if c.Role(Coimbatore) != Promoted || c.Role(Chennai) != Demoted {
		t.Fatal("roles must flip after failover")
	}
}

func TestFailoverBreachesRPO(t *testing.T) {
	c := mustController(t)
	// replication lag 45s exceeds the 30s RPO → data-loss objective missed (but failover still happens)
	r, _ := c.Failover(true, 45*time.Second, 1*time.Minute)
	if r.RPOMet {
		t.Fatal("a 45s lag must breach the 30s RPO")
	}
	if !r.RTOMet {
		t.Fatal("RTO should still be met")
	}
	if r.Healthy() {
		t.Fatal("a failover that breaches RPO is not healthy")
	}
}

func TestFailoverBreachesRTO(t *testing.T) {
	c := mustController(t)
	r, _ := c.Failover(true, 5*time.Second, 9*time.Minute) // 9m > 5m RTO
	if r.RTOMet {
		t.Fatal("a 9m promotion must breach the 5m RTO")
	}
}

func TestRefuseFailoverToUnhealthyStandby(t *testing.T) {
	c := mustController(t)
	if _, err := c.Failover(false, time.Second, time.Minute); err == nil {
		t.Fatal("must refuse to fail over to an unhealthy standby")
	}
	if c.Primary() != Chennai {
		t.Fatal("a refused failover must not change the primary")
	}
}

func TestDrillIsNonDestructive(t *testing.T) {
	c := mustController(t)
	r, err := c.Drill(true, 10*time.Second, 2*time.Minute)
	if err != nil {
		t.Fatal(err)
	}
	if !r.Drill || !r.Healthy() {
		t.Fatalf("drill should grade healthy and be marked a drill: %+v", r)
	}
	// roles unchanged by a drill
	if c.Primary() != Chennai || c.Role(Coimbatore) != Standby {
		t.Fatal("a drill must NOT change any site role")
	}
}

func TestFailbackReturnsToChennai(t *testing.T) {
	c := mustController(t)
	c.Failover(true, 10*time.Second, 1*time.Minute) // now Coimbatore primary
	r, err := c.Failback(true, 8*time.Second, 90*time.Second)
	if err != nil {
		t.Fatal(err)
	}
	if r.Promoted != Chennai || c.Primary() != Chennai {
		t.Fatalf("failback should restore Chennai as primary: %+v", r)
	}
}

func TestTargetsValidation(t *testing.T) {
	if _, err := New(Targets{RPO: 0, RTO: time.Minute}); err == nil {
		t.Fatal("zero RPO must error")
	}
}
