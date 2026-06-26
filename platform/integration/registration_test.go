package integration

import (
	"fmt"
	"testing"
)

// Unit tests for the Co-curricular Registration invariants (pure transitions), including FIFO waitlist
// auto-promotion.

func baseEvent(cap int) ActivityEvent {
	return ActivityEvent{ID: "EVT-T", OrgUnit: "SCH-T", Name: "Trial", Category: "sports", SeatCap: cap, NextSeq: 1, Status: EventOpen}
}

// fillEvent registers n students (T01..Tn) in order.
func fillEvent(e ActivityEvent, n int) ActivityEvent {
	for i := 1; i <= n; i++ {
		out, err := applyRegister(e, fmt.Sprintf("SYN-S-T%02d", i), "now")
		if err != nil {
			panic(err)
		}
		e = out
	}
	return e
}

func TestRegistrationSeatCapAndWaitlist(t *testing.T) {
	e := fillEvent(baseEvent(4), 6) // 4 confirmed + 2 waitlisted
	if e.ConfirmedCount() != 4 {
		t.Fatalf("expected exactly 4 confirmed (seat cap), got %d", e.ConfirmedCount())
	}
	if e.WaitlistedCount() != 2 {
		t.Fatalf("expected 2 waitlisted, got %d", e.WaitlistedCount())
	}
}

func TestRegistrationUnique(t *testing.T) {
	e := fillEvent(baseEvent(4), 2)
	if _, err := applyRegister(e, "SYN-S-T01", "now"); err == nil {
		t.Fatal("expected a duplicate registration to be rejected")
	}
}

func TestRegistrationWindow(t *testing.T) {
	e, _ := applyCloseEvent(baseEvent(4), "now")
	if _, err := applyRegister(e, "SYN-S-T01", "now"); err == nil {
		t.Fatal("expected registration on a closed event to be rejected")
	}
}

func TestRegistrationAutoPromotion(t *testing.T) {
	e := fillEvent(baseEvent(4), 6) // T01..T04 confirmed; T05,T06 waitlisted (seq order)
	// Withdraw a confirmed seat → earliest waitlisted (T05) is promoted.
	out, err := applyWithdraw(e, "SYN-S-T02", "now")
	if err != nil {
		t.Fatalf("withdraw should succeed: %v", err)
	}
	if out.ConfirmedCount() != 4 {
		t.Fatalf("expected the confirmed count to stay at the cap (4), got %d", out.ConfirmedCount())
	}
	idx := out.activeIndex("SYN-S-T05")
	if idx < 0 || out.Registrations[idx].State != RegConfirmed {
		t.Fatal("expected the earliest waitlisted (T05) to be auto-promoted to confirmed")
	}
	idx6 := out.activeIndex("SYN-S-T06")
	if idx6 < 0 || out.Registrations[idx6].State != RegWaitlisted {
		t.Fatal("expected T06 to remain waitlisted (FIFO order)")
	}
}

func TestRegistrationWithdrawWaitlistedNoPromotion(t *testing.T) {
	e := fillEvent(baseEvent(4), 6)
	out, err := applyWithdraw(e, "SYN-S-T06", "now") // withdraw a waitlisted student
	if err != nil {
		t.Fatalf("withdraw should succeed: %v", err)
	}
	if out.ConfirmedCount() != 4 || out.WaitlistedCount() != 1 {
		t.Fatalf("expected 4 confirmed / 1 waitlisted after withdrawing a waitlisted student, got %d/%d", out.ConfirmedCount(), out.WaitlistedCount())
	}
}
