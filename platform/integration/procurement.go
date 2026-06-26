package integration

import (
	"errors"
	"fmt"
	"log"
	"os"
	"sync"
)

// Procurement & GeM Purchase Orders is an L6 finance vertical: a school raises a GeM (Government e-Marketplace)
// purchase order, receives goods against it, and pays the vendor — under two GFR (General Financial Rules)
// controls enforced server-side (money in paise):
//   - NO OVER-RECEIPT: cumulative goods received can never exceed the ordered quantity.
//   - NO OVER-PAYMENT BEYOND GOODS RECEIVED: cumulative payment can never exceed the value of goods actually
//     received (received_qty × unit_price) — you cannot pay for goods not yet delivered.
// Lifecycle: ordered → (receive / pay) → closed (only when fully received). Downward-governance scoped. Synthetic
// ids only, never real PII.

// Purchase-order status.
const (
	POOrdered = "ordered"
	POClosed  = "closed"
)

// PurchaseOrder is one GeM purchase order with its cumulative receipt + payment position.
type PurchaseOrder struct {
	ID             string `json:"id"`
	OrgUnit        string `json:"org_unit"`
	Item           string `json:"item"`
	Vendor         string `json:"vendor"`
	GemContract    string `json:"gem_contract,omitempty"`
	OrderedQty     int    `json:"ordered_qty"`
	UnitPricePaise int64  `json:"unit_price_paise"`
	ReceivedQty    int    `json:"received_qty"`
	PaidPaise      int64  `json:"paid_paise"`
	Status         string `json:"status"`
	CreatedOn      string `json:"created_on"`
	UpdatedAt      string `json:"updated_at"`
}

// orderedValuePaise is the full PO value; receivedValuePaise is the value of goods actually received.
func (po PurchaseOrder) orderedValuePaise() int64  { return int64(po.OrderedQty) * po.UnitPricePaise }
func (po PurchaseOrder) receivedValuePaise() int64 { return int64(po.ReceivedQty) * po.UnitPricePaise }

// Validate checks a PO's required fields.
func (po PurchaseOrder) Validate() error {
	if po.ID == "" || po.OrgUnit == "" {
		return errors.New("procurement: id and org_unit are required")
	}
	if po.Item == "" || po.Vendor == "" {
		return errors.New("procurement: item and vendor are required")
	}
	if po.OrderedQty < 1 {
		return errors.New("procurement: ordered_qty must be at least 1")
	}
	if po.UnitPricePaise < 0 {
		return errors.New("procurement: unit_price_paise must be non-negative")
	}
	return nil
}

// applyReceive books a goods receipt — rejecting an over-receipt beyond the ordered quantity.
func applyReceive(po PurchaseOrder, qty int, now string) (PurchaseOrder, error) {
	if po.Status == POClosed {
		return PurchaseOrder{}, errors.New("procurement: cannot receive against a closed PO")
	}
	if qty < 1 {
		return PurchaseOrder{}, errors.New("procurement: received quantity must be at least 1")
	}
	if po.ReceivedQty+qty > po.OrderedQty {
		return PurchaseOrder{}, fmt.Errorf("procurement: over-receipt — %d received + %d would exceed ordered %d",
			po.ReceivedQty, qty, po.OrderedQty)
	}
	po.ReceivedQty += qty
	po.UpdatedAt = now
	return po, nil
}

// applyPay books a payment — rejecting a payment that would exceed the value of goods actually received (GFR).
func applyPay(po PurchaseOrder, amountPaise int64, now string) (PurchaseOrder, error) {
	if amountPaise <= 0 {
		return PurchaseOrder{}, errors.New("procurement: payment must be positive")
	}
	if po.PaidPaise+amountPaise > po.receivedValuePaise() {
		return PurchaseOrder{}, fmt.Errorf("procurement: over-payment — paying %d on top of %d would exceed the value of goods received (%d); pay only for delivered goods",
			amountPaise, po.PaidPaise, po.receivedValuePaise())
	}
	po.PaidPaise += amountPaise
	po.UpdatedAt = now
	return po, nil
}

// applyClosePO closes a fully-received PO.
func applyClosePO(po PurchaseOrder, now string) (PurchaseOrder, error) {
	if po.ReceivedQty < po.OrderedQty {
		return PurchaseOrder{}, fmt.Errorf("procurement: cannot close %s — only %d of %d received", po.ID, po.ReceivedQty, po.OrderedQty)
	}
	po.Status = POClosed
	po.UpdatedAt = now
	return po, nil
}

type poFilter struct{ OrgUnit, Status string }

func matchPO(f poFilter, po PurchaseOrder) bool {
	if f.OrgUnit != "" && po.OrgUnit != f.OrgUnit {
		return false
	}
	if f.Status != "" && po.Status != f.Status {
		return false
	}
	return true
}

// poStore is the persistence port. *memPOStore and *pgPOStore satisfy it.
type poStore interface {
	Upsert(PurchaseOrder) (PurchaseOrder, error)
	Get(id string) (PurchaseOrder, bool)
	List(poFilter) []PurchaseOrder
}

type memPOStore struct {
	mu sync.Mutex
	m  map[string]PurchaseOrder
}

func newMemPOStore() *memPOStore { return &memPOStore{m: map[string]PurchaseOrder{}} }

func (s *memPOStore) Upsert(po PurchaseOrder) (PurchaseOrder, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.m[po.ID] = po
	return po, nil
}

func (s *memPOStore) Get(id string) (PurchaseOrder, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	po, ok := s.m[id]
	return po, ok
}

func (s *memPOStore) List(f poFilter) []PurchaseOrder {
	s.mu.Lock()
	defer s.mu.Unlock()
	out := make([]PurchaseOrder, 0, len(s.m))
	for _, po := range s.m {
		if matchPO(f, po) {
			out = append(out, po)
		}
	}
	return out
}

var (
	poOnce sync.Once
	poBack poStore
)

func poState() poStore {
	poOnce.Do(func() {
		if dsn := os.Getenv("DATABASE_URL"); dsn != "" {
			if pg, err := newPgPOStore(dsn); err == nil {
				poBack = pg
				log.Printf("procurement: using durable PostgreSQL store (DATABASE_URL set)")
			} else {
				log.Printf("procurement: DATABASE_URL set but PostgreSQL unavailable (%v); using in-memory", err)
				poBack = newMemPOStore()
			}
		} else {
			poBack = newMemPOStore()
		}
		seedProcurement(poBack)
	})
	return poBack
}

func poNow() string { return "2026-06-25T00:00:00Z" }

// CreatePurchaseOrder records a new GeM PO (status ordered). Audited.
func (p *Platform) CreatePurchaseOrder(po PurchaseOrder) (PurchaseOrder, error) {
	po.Status = POOrdered
	po.ReceivedQty = 0
	po.PaidPaise = 0
	if po.CreatedOn == "" {
		po.CreatedOn = "2026-06-25"
	}
	po.UpdatedAt = poNow()
	if err := po.Validate(); err != nil {
		p.appendAudit("procurement-officer", "procurement.create.denied", po.OrgUnit, "deny", err.Error())
		return PurchaseOrder{}, err
	}
	out, err := poState().Upsert(po)
	if err != nil {
		return PurchaseOrder{}, err
	}
	p.appendAudit("procurement-officer", "procurement.create", po.ID, "executed", fmt.Sprintf("%s x%d @ %d", po.Item, po.OrderedQty, po.UnitPricePaise))
	return out, nil
}

// ReceiveGoods books a goods receipt against a PO — rejecting an over-receipt. Audited.
func (p *Platform) ReceiveGoods(id string, qty int) (PurchaseOrder, error) {
	cur, ok := poState().Get(id)
	if !ok {
		return PurchaseOrder{}, errors.New("procurement: not found")
	}
	out, err := applyReceive(cur, qty, poNow())
	if err != nil {
		p.appendAudit("procurement-officer", "procurement.receive.denied", id, "deny", err.Error())
		return PurchaseOrder{}, err
	}
	if _, err := poState().Upsert(out); err != nil {
		return PurchaseOrder{}, err
	}
	p.appendAudit("procurement-officer", "procurement.receive", id, "executed", fmt.Sprintf("+%d → %d/%d", qty, out.ReceivedQty, out.OrderedQty))
	return out, nil
}

// PayVendor books a payment against a PO — rejecting an over-payment beyond goods received. Audited.
func (p *Platform) PayVendor(id string, amountPaise int64) (PurchaseOrder, error) {
	cur, ok := poState().Get(id)
	if !ok {
		return PurchaseOrder{}, errors.New("procurement: not found")
	}
	out, err := applyPay(cur, amountPaise, poNow())
	if err != nil {
		p.appendAudit("procurement-officer", "procurement.pay.denied", id, "deny", err.Error())
		return PurchaseOrder{}, err
	}
	if _, err := poState().Upsert(out); err != nil {
		return PurchaseOrder{}, err
	}
	p.appendAudit("procurement-officer", "procurement.pay", id, "executed", fmt.Sprintf("+%d → paid %d", amountPaise, out.PaidPaise))
	return out, nil
}

// ClosePurchaseOrder closes a fully-received PO. Audited.
func (p *Platform) ClosePurchaseOrder(id string) (PurchaseOrder, error) {
	cur, ok := poState().Get(id)
	if !ok {
		return PurchaseOrder{}, errors.New("procurement: not found")
	}
	out, err := applyClosePO(cur, poNow())
	if err != nil {
		p.appendAudit("procurement-officer", "procurement.close.denied", id, "deny", err.Error())
		return PurchaseOrder{}, err
	}
	if _, err := poState().Upsert(out); err != nil {
		return PurchaseOrder{}, err
	}
	p.appendAudit("procurement-officer", "procurement.close", id, "executed", "closed")
	return out, nil
}

// PurchaseOrderRecord returns a single PO by id.
func (p *Platform) PurchaseOrderRecord(id string) (PurchaseOrder, bool) { return poState().Get(id) }

// ProcurementDashboard is the jurisdiction-scoped procurement picture (money in paise): PO counts by status, the
// ordered/received/paid value totals, the outstanding-to-pay (received-but-unpaid) total, and the pending-receipt
// worklist. Downward-governance scoped.
type ProcurementDashboard struct {
	Scope              string          `json:"scope"`
	POs                int             `json:"pos"`
	ByStatus           map[string]int  `json:"by_status"`
	OrderedValuePaise  int64           `json:"ordered_value_paise"`
	ReceivedValuePaise int64           `json:"received_value_paise"`
	PaidPaise          int64           `json:"paid_paise"`
	OutstandingPaise   int64           `json:"outstanding_paise"`
	PendingReceipt     []PurchaseOrder `json:"pending_receipt,omitempty"`
	Synthetic          bool            `json:"synthetic"`
}

// ProcurementDashboard rolls up POs across the schools a tenant node governs (fail-closed for others).
func (p *Platform) ProcurementDashboard(scopeOrg string) ProcurementDashboard {
	d := ProcurementDashboard{Scope: scopeOrg, ByStatus: map[string]int{}, Synthetic: true}
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return d
	}
	for _, po := range poState().List(poFilter{}) {
		if !h.Governs(scopeOrg, po.OrgUnit) {
			continue
		}
		d.POs++
		d.ByStatus[po.Status]++
		d.OrderedValuePaise += po.orderedValuePaise()
		d.ReceivedValuePaise += po.receivedValuePaise()
		d.PaidPaise += po.PaidPaise
		if po.Status == POOrdered && po.ReceivedQty < po.OrderedQty {
			d.PendingReceipt = append(d.PendingReceipt, po)
		}
	}
	d.OutstandingPaise = d.ReceivedValuePaise - d.PaidPaise
	return d
}

// ScopedPurchaseOrders lists POs a tenant node governs (optionally filtered by status).
func (p *Platform) ScopedPurchaseOrders(scopeOrg, status string) []PurchaseOrder {
	h, err := tenancyHierarchy()
	if err != nil || h == nil {
		return nil
	}
	var out []PurchaseOrder
	for _, po := range poState().List(poFilter{Status: status}) {
		if h.Governs(scopeOrg, po.OrgUnit) {
			out = append(out, po)
		}
	}
	return out
}

// seedProcurement plants GeM POs across schools over more than one district: one part-received-and-part-paid, one
// fully received awaiting payment, one fresh order awaiting receipt. Money in paise. Synthetic ids only.
func seedProcurement(s poStore) {
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
		// Benches: 50 ordered @ ₹2,500, 30 received, ₹50,000 paid (within received value ₹75,000).
		benches := PurchaseOrder{
			ID: fmt.Sprintf("PO-%s-01", tag), OrgUnit: school, Item: "Dual-desk benches", Vendor: "SYN-VEN-FURN",
			GemContract: "GEMC-" + tag + "-001", OrderedQty: 50, UnitPricePaise: 2_500_00, CreatedOn: "2026-06-05", UpdatedAt: poNow(),
		}
		benches.Status = POOrdered
		if r, err := applyReceive(benches, 30, poNow()); err == nil {
			if pp, err := applyPay(r, 50_000_00, poNow()); err == nil {
				benches = pp
			}
		}
		s.Upsert(benches)

		// Tablets: 20 ordered @ ₹9,000, fully received, unpaid.
		tablets := PurchaseOrder{
			ID: fmt.Sprintf("PO-%s-02", tag), OrgUnit: school, Item: "Smart-class tablets", Vendor: "SYN-VEN-ICT",
			GemContract: "GEMC-" + tag + "-002", OrderedQty: 20, UnitPricePaise: 9_000_00, CreatedOn: "2026-06-12", UpdatedAt: poNow(),
		}
		tablets.Status = POOrdered
		if r, err := applyReceive(tablets, 20, poNow()); err == nil {
			tablets = r
		}
		s.Upsert(tablets)

		// Library books: 200 ordered @ ₹350, awaiting receipt.
		books := PurchaseOrder{
			ID: fmt.Sprintf("PO-%s-03", tag), OrgUnit: school, Item: "Library books", Vendor: "SYN-VEN-BOOK",
			GemContract: "GEMC-" + tag + "-003", OrderedQty: 200, UnitPricePaise: 350_00, CreatedOn: "2026-06-20", UpdatedAt: poNow(),
			Status: POOrdered,
		}
		if err := books.Validate(); err == nil {
			s.Upsert(books)
		}
	}
}
