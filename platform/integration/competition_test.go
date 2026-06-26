package integration

import "testing"

// Unit tests for the Co-curricular & Sports Competitions invariants (pure transitions).

func baseCompetition(level string) Competition {
	c := Competition{ID: "COMP-T", OrgUnit: "SCH-T", Name: "Sprint", Discipline: "athletics", Level: level, Status: CompOpen}
	for _, s := range []string{"SYN-S-1", "SYN-S-2", "SYN-S-3", "SYN-S-4"} {
		out, err := applyEnterCompetition(c, s, "Grade 9", "now")
		if err != nil {
			panic(err)
		}
		c = out
	}
	return c
}

func TestCompetitionUniqueEntry(t *testing.T) {
	c := baseCompetition("school")
	if _, err := applyEnterCompetition(c, "SYN-S-1", "Grade 9", "now"); err == nil {
		t.Fatal("expected a duplicate entry to be rejected")
	}
}

func TestCompetitionPodiumUniqueness(t *testing.T) {
	c := baseCompetition("school")
	c, err := applyRecordResult(c, "SYN-S-1", 1, "now")
	if err != nil {
		t.Fatalf("first gold should succeed: %v", err)
	}
	if _, err := applyRecordResult(c, "SYN-S-2", 1, "now"); err == nil {
		t.Fatal("expected a second 1st-place award to be rejected (podium uniqueness)")
	}
	if _, err := applyRecordResult(c, "SYN-S-2", 4, "now"); err == nil {
		t.Fatal("expected an out-of-range position (4) to be rejected")
	}
}

func TestCompetitionAdvancementGate(t *testing.T) {
	c := baseCompetition("school")
	c, _ = applyRecordResult(c, "SYN-S-1", 1, "now")
	// Non-finisher cannot advance.
	if _, err := applyAdvanceWinner(c, "SYN-S-4", "now"); err == nil {
		t.Fatal("expected a non-finisher advance to be rejected")
	}
	// Finisher advances.
	out, err := applyAdvanceWinner(c, "SYN-S-1", "now")
	if err != nil {
		t.Fatalf("expected a podium finisher to advance: %v", err)
	}
	if idx := out.entryIndex("SYN-S-1"); idx < 0 || !out.Entries[idx].Advanced {
		t.Fatal("expected the finisher to be marked advanced")
	}
}

func TestCompetitionNationalTerminal(t *testing.T) {
	c := baseCompetition("national")
	c, _ = applyRecordResult(c, "SYN-S-1", 1, "now")
	if _, err := applyAdvanceWinner(c, "SYN-S-1", "now"); err == nil {
		t.Fatal("expected a national-level result to be terminal (no further advancement)")
	}
}
