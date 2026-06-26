package integration

import "testing"

// Unit tests for the School Stores / Inventory invariants (pure transitions).

func baseStock() StockItem {
	return StockItem{ID: "STK-T", OrgUnit: "SCH-T", Name: "A4 paper", Unit: "ream", OnHand: 40, ReorderLevel: 10, Received: 40, Status: StockActive}
}

func TestStockNoNegative(t *testing.T) {
	it := baseStock()
	if _, err := applyStockIssue(it, 41, "now"); err == nil {
		t.Fatal("expected issuing 41 of 40 on hand to be rejected (no negative stock)")
	}
	out, err := applyStockIssue(it, 10, "now")
	if err != nil || out.OnHand != 30 {
		t.Fatalf("expected a valid issue to leave 30 on hand, got %d (err=%v)", out.OnHand, err)
	}
}

func TestStockReceiveAddsBalance(t *testing.T) {
	out, err := applyStockReceive(baseStock(), 5, "now")
	if err != nil || out.OnHand != 45 || out.Received != 45 {
		t.Fatalf("expected receive to raise on-hand to 45 and cumulative received to 45, got on_hand=%d received=%d (err=%v)", out.OnHand, out.Received, err)
	}
}

func TestStockNoCloseWithBalance(t *testing.T) {
	if _, err := applyStockClose(baseStock(), "now"); err == nil {
		t.Fatal("expected closing an item with 40 on hand to be rejected")
	}
	empty := baseStock()
	empty.OnHand = 0
	out, err := applyStockClose(empty, "now")
	if err != nil || out.Status != StockClosed {
		t.Fatalf("expected closing a zero-balance item to succeed, got status=%s (err=%v)", out.Status, err)
	}
}

func TestStockLowStockFlag(t *testing.T) {
	it := baseStock()
	it.OnHand = 10 // at reorder level
	if !it.LowStock() {
		t.Fatal("expected an item at its reorder level to be flagged low")
	}
}
