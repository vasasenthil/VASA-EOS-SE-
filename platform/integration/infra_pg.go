package integration

import (
	"database/sql"
	"errors"

	"github.com/vasa-eos-se-tn/platform/infra"
)

// pgInfraStore is the durable PostgreSQL adapter for the Infrastructure & Asset register (assets + maintenance
// tickets). The lifecycle transitions reuse the pure Apply* functions; the register invariants (ticket only
// against a non-decommissioned asset; no decommission with open tickets) are enforced against the durable state.
type pgInfraStore struct{ db *sql.DB }

func newPgInfraStore(dsn string) (*pgInfraStore, error) {
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, err
	}
	if err := db.Ping(); err != nil {
		return nil, err
	}
	s := &pgInfraStore{db: db}
	if err := s.ensureSchema(); err != nil {
		return nil, err
	}
	return s, nil
}

func (s *pgInfraStore) ensureSchema() error {
	_, err := s.db.Exec(`
CREATE TABLE IF NOT EXISTS infra_assets (
    id          TEXT PRIMARY KEY,
    org_unit    TEXT NOT NULL,
    name        TEXT NOT NULL,
    category    TEXT NOT NULL,
    condition   TEXT NOT NULL,
    status      TEXT NOT NULL,
    acquired_on TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS infra_tickets (
    id          TEXT PRIMARY KEY,
    asset_id    TEXT NOT NULL,
    org_unit    TEXT NOT NULL,
    issue       TEXT NOT NULL,
    severity    TEXT NOT NULL,
    status      TEXT NOT NULL,
    raised_on   TEXT NOT NULL,
    assignee    TEXT NOT NULL DEFAULT '',
    resolved_on TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS infra_assets_org_idx  ON infra_assets (org_unit, status);
CREATE INDEX IF NOT EXISTS infra_tickets_asset_idx ON infra_tickets (asset_id, status);`)
	return err
}

const infraAssetCols = "id,org_unit,name,category,condition,status,acquired_on"
const infraTicketCols = "id,asset_id,org_unit,issue,severity,status,raised_on,assignee,resolved_on"

func scanAsset(row interface{ Scan(...any) error }) (infra.Asset, error) {
	var a infra.Asset
	err := row.Scan(&a.ID, &a.OrgUnit, &a.Name, &a.Category, &a.Condition, &a.Status, &a.AcquiredOn)
	return a, err
}

func scanTicket(row interface{ Scan(...any) error }) (infra.Ticket, error) {
	var t infra.Ticket
	err := row.Scan(&t.ID, &t.AssetID, &t.OrgUnit, &t.Issue, &t.Severity, &t.Status, &t.RaisedOn, &t.Assignee, &t.ResolvedOn)
	return t, err
}

// UpsertAsset validates then upserts an asset by id.
func (s *pgInfraStore) UpsertAsset(a infra.Asset) (infra.Asset, error) {
	if err := a.Validate(); err != nil {
		return infra.Asset{}, err
	}
	if _, err := s.db.Exec(`INSERT INTO infra_assets (`+infraAssetCols+`)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        ON CONFLICT (id) DO UPDATE SET org_unit=$2,name=$3,category=$4,condition=$5,status=$6,acquired_on=$7`,
		a.ID, a.OrgUnit, a.Name, a.Category, a.Condition, a.Status, a.AcquiredOn); err != nil {
		return infra.Asset{}, err
	}
	return a, nil
}

func (s *pgInfraStore) GetAsset(id string) (infra.Asset, bool) {
	a, err := scanAsset(s.db.QueryRow(`SELECT `+infraAssetCols+` FROM infra_assets WHERE id=$1`, id))
	if err != nil {
		return infra.Asset{}, false
	}
	return a, true
}

func (s *pgInfraStore) GetTicket(id string) (infra.Ticket, bool) {
	t, err := scanTicket(s.db.QueryRow(`SELECT `+infraTicketCols+` FROM infra_tickets WHERE id=$1`, id))
	if err != nil {
		return infra.Ticket{}, false
	}
	return t, true
}

func (s *pgInfraStore) openTicketCount(q interface {
	QueryRow(string, ...any) *sql.Row
}, assetID string) (int, error) {
	var n int
	err := q.QueryRow(`SELECT count(*) FROM infra_tickets WHERE asset_id=$1 AND status IN ('open','in_progress')`, assetID).Scan(&n)
	return n, err
}

// RaiseTicket validates the asset state and, in one transaction, writes the ticket and (for a critical ticket)
// flips an in-service asset to under_maintenance.
func (s *pgInfraStore) RaiseTicket(t infra.Ticket) (infra.Ticket, error) {
	t.Status = infra.TicketOpen
	t.Assignee = ""
	t.ResolvedOn = ""
	if err := t.Validate(); err != nil {
		return infra.Ticket{}, err
	}
	a, ok := s.GetAsset(t.AssetID)
	if !ok {
		return infra.Ticket{}, errors.New("infra: unknown asset " + t.AssetID)
	}
	if a.Status == infra.Decommissioned {
		return infra.Ticket{}, errors.New("infra: cannot raise a ticket against a decommissioned asset")
	}
	tx, err := s.db.Begin()
	if err != nil {
		return infra.Ticket{}, err
	}
	defer tx.Rollback()
	if _, err := tx.Exec(`INSERT INTO infra_tickets (`+infraTicketCols+`)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        ON CONFLICT (id) DO UPDATE SET asset_id=$2,org_unit=$3,issue=$4,severity=$5,status=$6,raised_on=$7,assignee=$8,resolved_on=$9`,
		t.ID, t.AssetID, t.OrgUnit, t.Issue, t.Severity, t.Status, t.RaisedOn, t.Assignee, t.ResolvedOn); err != nil {
		return infra.Ticket{}, err
	}
	if t.Severity == infra.SevCritical && a.Status == infra.InService {
		if _, err := tx.Exec(`UPDATE infra_assets SET status=$2 WHERE id=$1`, a.ID, infra.UnderMaintenance); err != nil {
			return infra.Ticket{}, err
		}
	}
	if err := tx.Commit(); err != nil {
		return infra.Ticket{}, err
	}
	return t, nil
}

// updateTicket persists a ticket's post-transition state.
func (s *pgInfraStore) updateTicket(t infra.Ticket) error {
	_, err := s.db.Exec(`UPDATE infra_tickets SET status=$2,assignee=$3,resolved_on=$4 WHERE id=$1`,
		t.ID, t.Status, t.Assignee, t.ResolvedOn)
	return err
}

func (s *pgInfraStore) AssignTicket(id, assignee string) (infra.Ticket, error) {
	t, ok := s.GetTicket(id)
	if !ok {
		return infra.Ticket{}, errors.New("infra: no such ticket " + id)
	}
	out, err := infra.ApplyAssign(t, assignee)
	if err != nil {
		return infra.Ticket{}, err
	}
	return out, s.updateTicket(out)
}

func (s *pgInfraStore) ResolveTicket(id, on string) (infra.Ticket, error) {
	t, ok := s.GetTicket(id)
	if !ok {
		return infra.Ticket{}, errors.New("infra: no such ticket " + id)
	}
	out, err := infra.ApplyResolve(t, on)
	if err != nil {
		return infra.Ticket{}, err
	}
	return out, s.updateTicket(out)
}

func (s *pgInfraStore) CloseTicket(id string) (infra.Ticket, error) {
	t, ok := s.GetTicket(id)
	if !ok {
		return infra.Ticket{}, errors.New("infra: no such ticket " + id)
	}
	out, err := infra.ApplyClose(t)
	if err != nil {
		return infra.Ticket{}, err
	}
	return out, s.updateTicket(out)
}

// DecommissionAsset retires an asset only if it has no open tickets (checked against the durable state).
func (s *pgInfraStore) DecommissionAsset(id string) (infra.Asset, error) {
	a, ok := s.GetAsset(id)
	if !ok {
		return infra.Asset{}, errors.New("infra: unknown asset " + id)
	}
	n, err := s.openTicketCount(s.db, id)
	if err != nil {
		return infra.Asset{}, err
	}
	if n > 0 {
		return infra.Asset{}, errors.New("infra: cannot decommission an asset with open maintenance tickets — close them first")
	}
	a.Status = infra.Decommissioned
	if _, err := s.db.Exec(`UPDATE infra_assets SET status=$2 WHERE id=$1`, id, a.Status); err != nil {
		return infra.Asset{}, err
	}
	return a, nil
}

// ReturnAssetToService returns an asset to service (refused while open tickets remain, or if decommissioned).
func (s *pgInfraStore) ReturnAssetToService(id, condition string) (infra.Asset, error) {
	a, ok := s.GetAsset(id)
	if !ok {
		return infra.Asset{}, errors.New("infra: unknown asset " + id)
	}
	if a.Status == infra.Decommissioned {
		return infra.Asset{}, errors.New("infra: a decommissioned asset cannot return to service")
	}
	n, err := s.openTicketCount(s.db, id)
	if err != nil {
		return infra.Asset{}, err
	}
	if n > 0 {
		return infra.Asset{}, errors.New("infra: cannot return an asset to service with open tickets")
	}
	if condition != "" {
		a.Condition = condition
	}
	a.Status = infra.InService
	// validate before persisting so an invalid condition argument is rejected (consistent with the in-memory store).
	if err := a.Validate(); err != nil {
		return infra.Asset{}, err
	}
	if _, err := s.db.Exec(`UPDATE infra_assets SET status=$2, condition=$3 WHERE id=$1`, id, a.Status, a.Condition); err != nil {
		return infra.Asset{}, err
	}
	return a, nil
}

func (s *pgInfraStore) ListAssets(f infra.AssetFilter) []infra.Asset {
	rows, err := s.db.Query(`SELECT ` + infraAssetCols + ` FROM infra_assets ORDER BY id`)
	if err != nil {
		return nil
	}
	defer rows.Close()
	var out []infra.Asset
	for rows.Next() {
		a, err := scanAsset(rows)
		if err != nil {
			continue
		}
		if infra.MatchAsset(f, a) {
			out = append(out, a)
		}
	}
	return out
}

func (s *pgInfraStore) ListTickets(f infra.TicketFilter) []infra.Ticket {
	rows, err := s.db.Query(`SELECT ` + infraTicketCols + ` FROM infra_tickets ORDER BY raised_on DESC, id`)
	if err != nil {
		return nil
	}
	defer rows.Close()
	var out []infra.Ticket
	for rows.Next() {
		t, err := scanTicket(rows)
		if err != nil {
			continue
		}
		if infra.MatchTicket(f, t) {
			out = append(out, t)
		}
	}
	return out
}
