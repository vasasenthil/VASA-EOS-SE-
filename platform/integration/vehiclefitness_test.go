package integration

import "testing"

// Unit tests for the Vehicle Fitness / Transport-Safety invariants (pure transitions).

func baseVehicle() FitnessVehicle {
	return FitnessVehicle{ID: "VEH-T", OrgUnit: "SCH-T", RegNo: "SYN-TN-T-0001", Status: FitnessGrounded}
}

func fullyDocumented() FitnessVehicle {
	v := baseVehicle()
	for _, kind := range requiredFitnessDocs {
		out, err := applyRecordDoc(v, kind, true, "2027-03-31", "now")
		if err != nil {
			panic(err)
		}
		v = out
	}
	return v
}

func TestVehicleClearanceGate(t *testing.T) {
	// Missing documents → cannot clear.
	if _, err := applyClearVehicle(baseVehicle(), "now"); err == nil {
		t.Fatal("expected clearing a vehicle with no documents to be rejected")
	}
	// All required valid → clears.
	out, err := applyClearVehicle(fullyDocumented(), "now")
	if err != nil || out.Status != FitnessCleared {
		t.Fatalf("expected a fully-documented vehicle to clear, status=%s err=%v", out.Status, err)
	}
	// One invalid required doc → blocked.
	v, _ := applyRecordDoc(fullyDocumented(), "insurance", false, "", "now")
	if len(v.blockers()) == 0 {
		t.Fatal("expected a lapsed insurance to be a blocker")
	}
	if _, err := applyClearVehicle(v, "now"); err == nil {
		t.Fatal("expected clearance to be rejected while insurance is lapsed")
	}
}

func TestVehicleAutoGroundOnLapse(t *testing.T) {
	cleared, err := applyClearVehicle(fullyDocumented(), "now")
	if err != nil || cleared.Status != FitnessCleared {
		t.Fatalf("setup: expected cleared, err=%v", err)
	}
	// Lapsing a required document must auto-ground the vehicle.
	grounded, err := applyRecordDoc(cleared, "puc", false, "", "now")
	if err != nil {
		t.Fatalf("recording a lapse should succeed: %v", err)
	}
	if grounded.Status != FitnessGrounded {
		t.Fatal("expected the vehicle to be auto-grounded on a required-document lapse")
	}
}

func TestVehicleInvalidDocKind(t *testing.T) {
	if _, err := applyRecordDoc(baseVehicle(), "horn", true, "", "now"); err == nil {
		t.Fatal("expected an unknown document kind to be rejected")
	}
}

func TestVehicleRenewClearsBlocker(t *testing.T) {
	v, _ := applyRecordDoc(fullyDocumented(), "fitness", false, "", "now") // lapse fitness
	if _, err := applyClearVehicle(v, "now"); err == nil {
		t.Fatal("setup: expected clearance blocked with lapsed fitness")
	}
	renewed, _ := applyRecordDoc(v, "fitness", true, "2028-01-01", "now") // renew
	out, err := applyClearVehicle(renewed, "now")
	if err != nil || out.Status != FitnessCleared {
		t.Fatalf("expected clearance to succeed after renewing fitness, status=%s err=%v", out.Status, err)
	}
}
