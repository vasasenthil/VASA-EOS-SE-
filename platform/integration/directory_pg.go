package integration

import (
	"database/sql"
	"encoding/json"

	"github.com/vasa-eos-se-tn/platform/directory"
)

// userDirectory is the persistence port for the user directory. *directory.Directory (in-memory) and
// *pgUserDirectory (PostgreSQL) satisfy it, so the unified PDP decides over either backend identically.
type userDirectory interface {
	Upsert(directory.User)
	Get(string) (directory.User, bool)
	All() []directory.User
	ByRole(string) []directory.User
	ByOrg(string) []directory.User
	RoleCounts() map[string]int
	Count() int
}

// pgUserDirectory persists directory users (role · org unit · ABAC attributes · suspension) to PostgreSQL, so
// the identity plane the access decisions run over is durable and CRUD-mutable — not a fixed in-memory seed.
type pgUserDirectory struct{ db *sql.DB }

func newPgUserDirectory(dsn string) (*pgUserDirectory, error) {
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, err
	}
	if err := db.Ping(); err != nil {
		return nil, err
	}
	d := &pgUserDirectory{db: db}
	if err := d.ensureSchema(); err != nil {
		return nil, err
	}
	return d, nil
}

func (d *pgUserDirectory) ensureSchema() error {
	_, err := d.db.Exec(`
CREATE TABLE IF NOT EXISTS directory_users (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL DEFAULT '',
    role       TEXT NOT NULL,
    org_unit   TEXT NOT NULL,
    attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
    suspended  BOOLEAN NOT NULL DEFAULT false,
    seq        BIGSERIAL
);
CREATE INDEX IF NOT EXISTS directory_users_role_idx ON directory_users (role);
CREATE INDEX IF NOT EXISTS directory_users_org_idx  ON directory_users (org_unit);`)
	return err
}

func userFromRow(row interface{ Scan(...any) error }) (directory.User, error) {
	var u directory.User
	var attrs []byte
	if err := row.Scan(&u.ID, &u.Name, &u.Role, &u.OrgUnit, &attrs, &u.Suspended); err != nil {
		return directory.User{}, err
	}
	if len(attrs) > 0 {
		_ = json.Unmarshal(attrs, &u.Attributes)
	}
	return u, nil
}

const userCols = "id,name,role,org_unit,attributes,suspended"

// Upsert inserts or updates a user by id (idempotent; preserves the original insertion order via seq).
func (d *pgUserDirectory) Upsert(u directory.User) {
	attrs, _ := json.Marshal(u.Attributes)
	if len(attrs) == 0 {
		attrs = []byte("{}")
	}
	_, _ = d.db.Exec(`INSERT INTO directory_users (id,name,role,org_unit,attributes,suspended)
        VALUES ($1,$2,$3,$4,$5,$6)
        ON CONFLICT (id) DO UPDATE SET name=$2,role=$3,org_unit=$4,attributes=$5,suspended=$6`,
		u.ID, u.Name, u.Role, u.OrgUnit, attrs, u.Suspended)
}

func (d *pgUserDirectory) Get(id string) (directory.User, bool) {
	u, err := userFromRow(d.db.QueryRow(`SELECT `+userCols+` FROM directory_users WHERE id=$1`, id))
	if err != nil {
		return directory.User{}, false
	}
	return u, true
}

func (d *pgUserDirectory) query(where string, args ...any) []directory.User {
	rows, err := d.db.Query(`SELECT `+userCols+` FROM directory_users `+where+` ORDER BY seq`, args...)
	if err != nil {
		return nil
	}
	defer rows.Close()
	var out []directory.User
	for rows.Next() {
		if u, err := userFromRow(rows); err == nil {
			out = append(out, u)
		}
	}
	return out
}

func (d *pgUserDirectory) All() []directory.User               { return d.query("") }
func (d *pgUserDirectory) ByRole(role string) []directory.User { return d.query("WHERE role=$1", role) }
func (d *pgUserDirectory) ByOrg(org string) []directory.User {
	return d.query("WHERE org_unit=$1", org)
}

func (d *pgUserDirectory) RoleCounts() map[string]int {
	counts := map[string]int{}
	rows, err := d.db.Query(`SELECT role, COUNT(*) FROM directory_users GROUP BY role`)
	if err != nil {
		return counts
	}
	defer rows.Close()
	for rows.Next() {
		var role string
		var n int
		if err := rows.Scan(&role, &n); err == nil {
			counts[role] = n
		}
	}
	return counts
}

func (d *pgUserDirectory) Count() int {
	var n int
	_ = d.db.QueryRow(`SELECT COUNT(*) FROM directory_users`).Scan(&n)
	return n
}
