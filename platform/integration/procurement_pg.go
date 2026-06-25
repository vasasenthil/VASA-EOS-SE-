package integration

import "database/sql"

// pgPOStore is the durable PostgreSQL adapter for Procurement & GeM purchase orders.
type pgPOStore struct{ db *sql.DB }

func newPgPOStore(dsn string) (*pgPOStore, error) {
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, err
	}
	if err := db.Ping(); err != nil {
		return nil, err
	}
	s := &pgPOStore{db: db}
	if err := s.ensureSchema(); err != nil {
		return nil, err
	}
	return s, nil
}

func (s *pgPOStore) ensureSchema() error {
	_, err := s.db.Exec(`
CREATE TABLE IF NOT EXISTS purchase_orders (
    id               TEXT PRIMARY KEY,
    org_unit         TEXT NOT NULL,
    item             TEXT NOT NULL,
    vendor           TEXT NOT NULL,
    gem_contract     TEXT NOT NULL DEFAULT '',
    ordered_qty      INTEGER NOT NULL,
    unit_price_paise BIGINT NOT NULL DEFAULT 0,
    received_qty     INTEGER NOT NULL DEFAULT 0,
    paid_paise       BIGINT NOT NULL DEFAULT 0,
    status           TEXT NOT NULL,
    created_on       TEXT NOT NULL DEFAULT '',
    updated_at       TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS po_org_idx    ON purchase_orders (org_unit);
CREATE INDEX IF NOT EXISTS po_status_idx ON purchase_orders (status);`)
	return err
}

const poCols = "id,org_unit,item,vendor,gem_contract,ordered_qty,unit_price_paise,received_qty,paid_paise,status,created_on,updated_at"

func scanPO(row interface{ Scan(...any) error }) (PurchaseOrder, error) {
	var po PurchaseOrder
	err := row.Scan(&po.ID, &po.OrgUnit, &po.Item, &po.Vendor, &po.GemContract, &po.OrderedQty, &po.UnitPricePaise,
		&po.ReceivedQty, &po.PaidPaise, &po.Status, &po.CreatedOn, &po.UpdatedAt)
	if err != nil {
		return PurchaseOrder{}, err
	}
	return po, nil
}

func (s *pgPOStore) Upsert(po PurchaseOrder) (PurchaseOrder, error) {
	if _, err := s.db.Exec(`INSERT INTO purchase_orders (`+poCols+`)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
        ON CONFLICT (id) DO UPDATE SET org_unit=$2,item=$3,vendor=$4,gem_contract=$5,ordered_qty=$6,
            unit_price_paise=$7,received_qty=$8,paid_paise=$9,status=$10,created_on=$11,updated_at=$12`,
		po.ID, po.OrgUnit, po.Item, po.Vendor, po.GemContract, po.OrderedQty, po.UnitPricePaise, po.ReceivedQty, po.PaidPaise, po.Status, po.CreatedOn, po.UpdatedAt); err != nil {
		return PurchaseOrder{}, err
	}
	return po, nil
}

func (s *pgPOStore) Get(id string) (PurchaseOrder, bool) {
	po, err := scanPO(s.db.QueryRow(`SELECT `+poCols+` FROM purchase_orders WHERE id=$1`, id))
	if err != nil {
		return PurchaseOrder{}, false
	}
	return po, true
}

func (s *pgPOStore) List(f poFilter) []PurchaseOrder {
	rows, err := s.db.Query(`SELECT ` + poCols + ` FROM purchase_orders`)
	if err != nil {
		return nil
	}
	defer rows.Close()
	var out []PurchaseOrder
	for rows.Next() {
		po, err := scanPO(rows)
		if err != nil {
			continue
		}
		if matchPO(f, po) {
			out = append(out, po)
		}
	}
	return out
}
