package integration

import (
	"errors"
	"fmt"
	"log"
	"os"
	"sort"
	"sync"
)

// School Stores / Inventory is an L6 stock-control vertical: schools hold consumables and materials (lab
// chemicals, sports kit, stationery, MDM provisions) in a stock register and must issue them without ever going
// negative. It is durable, audited, and enforces two hard invariants server-side:
//   - NO NEGATIVE STOCK: an issue can never exceed the quantity on hand (you cannot issue stock you do not hold).
//   - NO CLOSE WITH STOCK: an item can only be retired from the register when its on-hand balance is zero.
// On-hand is maintained as a running balance with cumulative received/issued totals for audit. A reorder level
// drives a low-stock worklist. Downward-governance scoped. Synthetic SYN- ids only, never real PII.

// Stock-item status.
const (
	StockActive = "active"
	StockClosed = "closed"
)

func validStockUnit(u string) bool {
	switch u {
	case "nos", "kg", "litre", "pack", "metre", "ream":
		return true
	}
	return false
}

// StockItem is one line in a school's stock register with its running balance.
type StockItem struct {
	ID           string `json:"id"`
	OrgUnit      string `json:"org_unit"` // the school (T6 tenancy node)
	Name         string `json:"name"`
	Category     string `json:"category,omitempty"`
	Unit         string `json:"unit"` // nos | kg | litre | pack | metre | ream
	OnHand       int    `json:"on_hand"`
	ReorderLevel int    `json:"reorder_level"`
	Received     int    `json:"received"` // cumulative
	Issued       int    `json:"issued"`   // cumulative
	Status       string `json:"status"`
	CreatedOn    string `json:"created_on"`
	UpdatedAt    string `json:"updated_at"`
}

// Validate checks a stock item's required fields.
func (it StockItem) Validate() error {
	if it.ID == "" || it.OrgUnit == "" {
		return errors.New("inventory: id and org_unit are required")
	}
	if it.Name == "" {
		return errors.New("inventory: a name is required")
	}
	if !validStockUnit(it.Unit) {
		return errors.New("inventory: unit must be nos, kg, litre, pack, metre or ream")
	}
	if it.ReorderLevel < 0 {
		return errors.New("inventory: reorder_level must be non-negative")
	}
	return nil
}

// LowStock reports whether the item is at or below its reorder level (active items only).
func (it StockItem) LowStock() bool { return it.Status == StockActive && it.OnHand <= it.ReorderLevel }

// applyReceive books a goods receipt — increasing on-hand and the cumulative received total.
func applyStockReceive(it StockItem, qty int, now string) (StockItem, error) {
	if it.Status != StockActive {
		return StockItem{}, errors.New("inventory: cannot receive against a closed item")
	}
	if qty < 1 {
		return StockItem{}, errors.New("inventory: received quantity must be at least 1")
	}
	it.OnHand += qty
	it.Received += qty
	it.UpdatedAt = now
	return it, nil
}

// applyIssue books an issue — rejecting an issue beyond the quantity on hand (no negative stock).
func applyStockIssue(it StockItem, qty int, now string) (StockItem, error) {
	if it.Status != StockActive {
		return StockItem{}, errors.New("inventory: cannot issue from a closed item")
	}
	if qty < 1 {
		return StockItem{}, errors.New("inventory: issued quantity must be at least 1")
	}
	if qty > it.OnHand {
		return StockItem{}, fmt.Errorf("inventory: cannot issue %d of %s — only %d on hand (no negative stock)", qty, it.ID, it.OnHand)
	}
	it.OnHand -= qty
	it.Issued += qty
	it.UpdatedAt = now
	return it, nil
}

// applyStockClose retires an item — only when its on-hand balance is zero.
func applyStockClose(it StockItem, now string) (StockItem, error) {
	if it.OnHand > 0 {
		return StockItem{}, fmt.Errorf("inventory: cannot close %s — %d still on hand", it.ID, it.OnHand)
	}
	it.Status = StockClosed
	it.UpdatedAt = now
	return it, nil
}

type stockFilter struct{ OrgUnit, Status string }

func matchStock(f stockFilter, it StockItem) bool {
	if f.OrgUnit != "" && it.OrgUnit != f.OrgUnit {
		return false
	}
	if f.Status != "" && it.Status != f.Status {
		return false
	}
	return true
}

// stockStore is the persistence port. *memStockStore and *pgStockStore satisfy it.
type stockStore interface {
	Upsert(StockItem) (StockItem, error)
	Get(id string) (StockItem, bool)
	List(stockFilter) []StockItem
}

type memStockStore struct {
	mu sync.Mutex
	m  map[string]StockItem
}

func newMemStockStore() *memStockStore { return &memStockStore{m: map[string]StockItem{}} }

func (s *memStockStore) Upsert(it StockItem) (StockItem, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.m[it.ID] = it
	return it, nil
}

func (s *memStockStore) Get(id string) (StockItem, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	it, ok := s.m[id]
	return it, ok
}

func (s *memStockStore) List(f stockFilter) []StockItem {
	s.mu.Lock()
	defer s.mu.Unlock()
	out := make([]StockItem, 0, len(s.m))
	for _, it := range s.m {
		if matchStock(f, it) {
			out = append(out, it)
		}
	}
	return out
}

var (
	stockOnce sync.Once
	stockBack stockStore
)

func stockState() stockStore {
	stockOnce.Do(func() {
		if dsn := os.Getenv("DATABASE_URL"); dsn != "" {
			if pg, err := newPgStockStore(dsn); err == nil {
				stockBack = pg
				log.Printf("inventory: using durable PostgreSQL store (DATABASE_URL set)")
			} else {
				log.Printf("inventory: DATABASE_URL set but PostgreSQL unavailable (%v); using in-memory", err)
				stockBack = newMemStockStore()
			}
		} else {
			stockBack = newMemStockStore()
		}
		seedStock(stockBack)
	})
	return stockBack
}

func stockNow() string { return "2026-06-25T00:00:00Z" }

// AddStockItem records a new stock item (status active). Audited.
func (p *Platform) AddStockItem(it StockItem) (StockItem, error) {
	it.Status = StockActive
	if it.Received == 0 {
		it.Received = it.OnHand
	}
	it.Issued = 0
	if it.CreatedOn == "" {
		it.CreatedOn = "2026-06-25"
	}
	it.UpdatedAt = stockNow()
	if it.OnHand < 0 {
		return StockItem{}, errors.New("inventory: on_hand must be non-negative")
	}
	if err := it.Validate(); err != nil {
		p.appendAudit("stores-clerk", "inventory.add.denied", it.OrgUnit, "deny", err.Error())
		return StockItem{}, err
	}
	out, err := stockState().Upsert(it)
	if err != nil {
		return StockItem{}, err
	}
	p.appendAudit("stores-clerk", "inventory.add", it.ID, "executed", fmt.Sprintf("%s (%d %s)", it.Name, it.OnHand, it.Unit))
	return out, nil
}

// ReceiveStock books a goods receipt against an item. Audited.
func (p *Platform) ReceiveStock(id string, qty int) (StockItem, error) {
	cur, ok := stockState().Get(id)
	if !ok {
		return StockItem{}, errors.New("inventory: not found")
	}
	out, err := applyStockReceive(cur, qty, stockNow())
	if err != nil {
		p.appendAudit("stores-clerk", "inventory.receive.denied", id, "deny", err.Error())
		return StockItem{}, err
	}
	if _, err := stockState().Upsert(out); err != nil {
		return StockItem{}, err
	}
	p.appendAudit("stores-clerk", "inventory.receive", id, "executed", fmt.Sprintf("+%d → %d on hand", qty, out.OnHand))
	return out, nil
}

// IssueStock books an issue against an item — rejecting an issue beyond on-hand. Audited.
func (p *Platform) IssueStock(id string, qty int) (StockItem, error) {
	cur, ok := stockState().Get(id)
	if !ok {
		return StockItem{}, errors.New("inventory: not found")
	}
	out, err := applyStockIssue(cur, qty, stockNow())
	if err != nil {
		p.appendAudit("stores-clerk", "inventory.issue.denied", id, "deny", err.Error())
		return StockItem{}, err
	}
	if _, err := stockState().Upsert(out); err != nil {
		return StockItem{}, err
	}
	p.appendAudit("stores-clerk", "inventory.issue", id, "executed", fmt.Sprintf("-%d → %d on hand", qty, out.OnHand))
	return out, nil
}

// CloseStockItem retires an item with zero balance. Audited.
func (p *Platform) CloseStockItem(id string) (StockItem, error) {
	cur, ok := stockState().Get(id)
	if !ok {
		return StockItem{}, errors.New("inventory: not found")
	}
	out, err := applyStockClose(cur, stockNow())
	if err != nil {
		p.appendAudit("stores-clerk", "inventory.close.denied", id, "deny", err.Error())
		return StockItem{}, err
	}
	if _, err := stockState().Upsert(out); err != nil {
		return StockItem{}, err
	}
	p.appendAudit("stores-clerk", "inventory.close", id, "executed", "closed")
	return out, nil
}

// StockItemRecord returns a single item by id.
func (p *Platform) StockItemRecord(id string) (StockItem, bool) { return stockState().Get(id) }

// InventoryDashboard is the jurisdiction-scoped stores picture: item counts, on-hand/received/issued totals and
// the low-stock (at/below reorder level) worklist. Downward-governance scoped.
type InventoryDashboard struct {
	Scope     string         `json:"scope"`
	Items     int            `json:"items"`
	ByStatus  map[string]int `json:"by_status"`
	OnHand    int            `json:"on_hand"`
	Received  int            `json:"received"`
	Issued    int            `json:"issued"`
	LowStock  []StockItem    `json:"low_stock,omitempty"`
	Synthetic bool           `json:"synthetic"`
}

// InventoryDashboard rolls up stock items across the schools a tenant node governs (fail-closed for others).
func (p *Platform) InventoryDashboard(scopeOrg string) InventoryDashboard {
	d := InventoryDashboard{Scope: scopeOrg, ByStatus: map[string]int{}, Synthetic: true}
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return d
	}
	for _, it := range stockState().List(stockFilter{}) {
		if !h.Governs(scopeOrg, it.OrgUnit) {
			continue
		}
		d.Items++
		d.ByStatus[it.Status]++
		d.OnHand += it.OnHand
		d.Received += it.Received
		d.Issued += it.Issued
		if it.LowStock() {
			d.LowStock = append(d.LowStock, it)
		}
	}
	sort.Slice(d.LowStock, func(i, j int) bool { return d.LowStock[i].ID < d.LowStock[j].ID })
	return d
}

// ScopedStockItems lists stock items a tenant node governs (optionally filtered by status).
func (p *Platform) ScopedStockItems(scopeOrg, status string) []StockItem {
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return nil
	}
	var out []StockItem
	for _, it := range stockState().List(stockFilter{Status: status}) {
		if h.Governs(scopeOrg, it.OrgUnit) {
			out = append(out, it)
		}
	}
	return out
}

// seedStock plants stock items per school across more than one district: a well-stocked item, one at reorder
// level (low-stock signal) and one consumable. Synthetic SYN- ids only.
func seedStock(s stockStore) {
	schools := pilotSchools(4)
	if len(schools) == 0 {
		if only := tenancyLeafUnder(pilotDistrict()); only != "" {
			schools = []string{only}
		} else {
			return
		}
	}
	for si, school := range schools {
		tag := schoolTag(si)
		specs := []struct {
			name, category, unit string
			onHand, reorder      int
		}{
			{"A4 paper", "stationery", "ream", 40, 10},
			{"Chalk boxes", "stationery", "pack", 8, 10}, // at/below reorder → low stock
			{"Lab gloves", "lab", "pack", 25, 5},
			{"Football", "sports", "nos", 6, 4},
		}
		for ii, sp := range specs {
			it := StockItem{
				ID: fmt.Sprintf("STK-%s-%02d", tag, ii+1), OrgUnit: school, Name: sp.name, Category: sp.category,
				Unit: sp.unit, OnHand: sp.onHand, ReorderLevel: sp.reorder, Received: sp.onHand, Status: StockActive,
				CreatedOn: "2026-06-01", UpdatedAt: stockNow(),
			}
			if err := it.Validate(); err == nil {
				s.Upsert(it)
			}
		}
	}
}
