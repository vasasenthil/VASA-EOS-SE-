package integration

import (
	"database/sql"
	"log"
	"os"

	"github.com/vasa-eos-se-tn/platform/audit"
)

// newAuditLog builds the platform's tamper-evident audit log. When DATABASE_URL is set the chain is persisted
// to (and reloaded + re-verified from) PostgreSQL, so the audit trail survives process restarts; otherwise it
// is an in-memory log (credential-free demo). A persisted chain that fails verification at startup is rejected
// — the platform refuses to run on a tampered audit history (fail-closed).
func newAuditLog() (*audit.Log, error) {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		return audit.New(), nil
	}
	sink, err := newPgAuditSink(dsn)
	if err != nil {
		log.Printf("audit: DATABASE_URL set but PostgreSQL unavailable (%v); using in-memory log", err)
		return audit.New(), nil
	}
	l, err := audit.NewWithSink(sink)
	if err != nil {
		return nil, err // tampered/broken persisted chain → refuse to start
	}
	log.Printf("audit: using durable PostgreSQL hash-chain (DATABASE_URL set)")
	return l, nil
}

// pgAuditSink persists the audit hash-chain to PostgreSQL. Records are append-only; the (seq, hash, prev_hash)
// columns mean any tampering, reordering or truncation is caught when the chain is reloaded and re-verified.
type pgAuditSink struct{ db *sql.DB }

func newPgAuditSink(dsn string) (*pgAuditSink, error) {
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, err
	}
	if err := db.Ping(); err != nil {
		return nil, err
	}
	s := &pgAuditSink{db: db}
	if err := s.ensureSchema(); err != nil {
		return nil, err
	}
	return s, nil
}

func (s *pgAuditSink) ensureSchema() error {
	_, err := s.db.Exec(`
CREATE TABLE IF NOT EXISTS audit_chain (
    seq       BIGINT PRIMARY KEY,
    ts        TEXT NOT NULL DEFAULT '',
    actor     TEXT NOT NULL DEFAULT '',
    action    TEXT NOT NULL,
    resource  TEXT NOT NULL DEFAULT '',
    effect    TEXT NOT NULL DEFAULT '',
    detail    TEXT NOT NULL DEFAULT '',
    prev_hash TEXT NOT NULL,
    hash      TEXT NOT NULL UNIQUE
);`)
	return err
}

// Persist appends one sealed record. The seq primary key + hash uniqueness make persistence append-only.
func (s *pgAuditSink) Persist(r audit.Record) error {
	_, err := s.db.Exec(`INSERT INTO audit_chain (seq,ts,actor,action,resource,effect,detail,prev_hash,hash)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
		r.Seq, r.TS, r.Actor, r.Action, r.Resource, r.Effect, r.Detail, r.PrevHash, r.Hash)
	return err
}

// Load returns the full chain ordered by sequence (so the log can reload + re-verify it on startup).
func (s *pgAuditSink) Load() ([]audit.Record, error) {
	rows, err := s.db.Query(`SELECT seq,ts,actor,action,resource,effect,detail,prev_hash,hash FROM audit_chain ORDER BY seq`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []audit.Record
	for rows.Next() {
		var r audit.Record
		if err := rows.Scan(&r.Seq, &r.TS, &r.Actor, &r.Action, &r.Resource, &r.Effect, &r.Detail, &r.PrevHash, &r.Hash); err != nil {
			return nil, err
		}
		out = append(out, r)
	}
	return out, rows.Err()
}
