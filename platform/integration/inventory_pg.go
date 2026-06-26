package integration

import "database/sql"

// pgStockStore is the durable PostgreSQL adapter for the school stores / inventory register.
type pgStockStore struct{ db *sql.DB }

func newPgStockStore(dsn string) (*pgStockStore, error) {
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, err
	}
	if err := db.Ping(); err != nil {
		return nil, err
	}
	s := &pgStockStore{db: db}
	if err := s.ensureSchema(); err != nil {
		return nil, err
	}
	return s, nil
}

func (s *pgStockStore) ensureSchema() error {
	_, err := s.db.Exec(`
CREATE TABLE IF NOT EXISTS stock_items (
    id            TEXT PRIMARY KEY,
    org_unit      TEXT NOT NULL,
    name          TEXT NOT NULL,
    category      TEXT NOT NULL DEFAULT '',
    unit          TEXT NOT NULL,
    on_hand       INTEGER NOT NULL DEFAULT 0,
    reorder_level INTEGER NOT NULL DEFAULT 0,
    received      INTEGER NOT NULL DEFAULT 0,
    issued        INTEGER NOT NULL DEFAULT 0,
    status        TEXT NOT NULL,
    created_on    TEXT NOT NULL DEFAULT '',
    updated_at    TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS stock_org_idx    ON stock_items (org_unit);
CREATE INDEX IF NOT EXISTS stock_status_idx ON stock_items (status);`)
	return err
}

const stockCols = "id,org_unit,name,category,unit,on_hand,reorder_level,received,issued,status,created_on,updated_at"

func scanStock(row interface{ Scan(...any) error }) (StockItem, error) {
	var it StockItem
	err := row.Scan(&it.ID, &it.OrgUnit, &it.Name, &it.Category, &it.Unit, &it.OnHand, &it.ReorderLevel,
		&it.Received, &it.Issued, &it.Status, &it.CreatedOn, &it.UpdatedAt)
	if err != nil {
		return StockItem{}, err
	}
	return it, nil
}

func (s *pgStockStore) Upsert(it StockItem) (StockItem, error) {
	if _, err := s.db.Exec(`INSERT INTO stock_items (`+stockCols+`)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
        ON CONFLICT (id) DO UPDATE SET org_unit=$2,name=$3,category=$4,unit=$5,on_hand=$6,reorder_level=$7,
            received=$8,issued=$9,status=$10,created_on=$11,updated_at=$12`,
		it.ID, it.OrgUnit, it.Name, it.Category, it.Unit, it.OnHand, it.ReorderLevel, it.Received, it.Issued, it.Status, it.CreatedOn, it.UpdatedAt); err != nil {
		return StockItem{}, err
	}
	return it, nil
}

func (s *pgStockStore) Get(id string) (StockItem, bool) {
	it, err := scanStock(s.db.QueryRow(`SELECT `+stockCols+` FROM stock_items WHERE id=$1`, id))
	if err != nil {
		return StockItem{}, false
	}
	return it, true
}

func (s *pgStockStore) List(f stockFilter) []StockItem {
	rows, err := s.db.Query(`SELECT ` + stockCols + ` FROM stock_items`)
	if err != nil {
		return nil
	}
	defer rows.Close()
	var out []StockItem
	for rows.Next() {
		it, err := scanStock(rows)
		if err != nil {
			continue
		}
		if matchStock(f, it) {
			out = append(out, it)
		}
	}
	return out
}
