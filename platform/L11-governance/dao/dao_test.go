package dao

import "testing"

func council(t *testing.T) *Council {
	t.Helper()
	c := NewCouncil("SMC-1", "GHSS Egmore SMC", "33010100101", nil)
	c.IssueBadge("parent-1", "parent")
	c.IssueBadge("parent-2", "parent")
	c.IssueBadge("teacher-1", "teacher")
	c.IssueBadge("head-1", "head-teacher")
	return c
}

func TestSoulboundBadgeNonTransferable(t *testing.T) {
	c := council(t)
	if !c.IsMember("parent-1") || c.Size() != 4 {
		t.Fatalf("council should have 4 soulbound members, got %d", c.Size())
	}
	for _, b := range c.Members() {
		if !b.Soulbound {
			t.Fatalf("every council badge must be soulbound: %+v", b)
		}
	}
	// a soulbound badge can never be transferred.
	if err := c.TransferBadge("parent-1", "outsider"); err != ErrSoulbound {
		t.Fatalf("transfer must be rejected as soulbound, got %v", err)
	}
	// revocation works (authority removes a member).
	if !c.RevokeBadge("parent-2") || c.IsMember("parent-2") {
		t.Fatal("revocation should remove the member")
	}
}

func TestVotingMembersOnlyAndOncePassedIsAdvisory(t *testing.T) {
	c := council(t)
	p := c.Propose("PROP-1", "Adopt the new library-hours plan")
	// a non-member cannot vote.
	if err := p.Cast("outsider", Yes); err != ErrNotMember {
		t.Fatalf("a non-member must not be able to vote, got %v", err)
	}
	if err := p.Cast("parent-1", Yes); err != nil {
		t.Fatal(err)
	}
	// one vote per member.
	if err := p.Cast("parent-1", No); err != ErrDuplicate {
		t.Fatalf("a member must not vote twice, got %v", err)
	}
	_ = p.Cast("parent-2", Yes)
	_ = p.Cast("teacher-1", Yes)
	_ = p.Cast("head-1", No)

	o := p.Tally(3, 0.6) // quorum 3, threshold 60%
	if o.Status != Passed {
		t.Fatalf("3 yes / 1 no (75%%) over quorum must pass, got %s (%+v)", o.Status, o)
	}
	// the defining rule: a passed proposal is ADVISORY and must be ratified by the statutory authority.
	if !o.Advisory || !o.NeedsRatify {
		t.Fatalf("a council decision must be advisory + need ratification: %+v", o)
	}
	// the proposal is closed after tally.
	if err := p.Cast("parent-1", Yes); err != ErrClosed {
		t.Fatalf("a closed proposal must reject further votes, got %v", err)
	}
}

func TestQuorumAndThreshold(t *testing.T) {
	c := council(t)
	// below quorum.
	p1 := c.Propose("P-A", "x")
	_ = p1.Cast("parent-1", Yes)
	if o := p1.Tally(3, 0.5); o.Status != NoQuorum {
		t.Fatalf("1 vote under quorum 3 must be no-quorum, got %s", o.Status)
	}
	// quorum met but below threshold.
	p2 := c.Propose("P-B", "y")
	_ = p2.Cast("parent-1", Yes)
	_ = p2.Cast("parent-2", No)
	_ = p2.Cast("teacher-1", No)
	o := p2.Tally(3, 0.6)
	if o.Status != Rejected {
		t.Fatalf("1 yes / 2 no (33%%) must be rejected, got %s", o.Status)
	}
	if o.NeedsRatify {
		t.Fatal("a rejected proposal must not need ratification")
	}
}
