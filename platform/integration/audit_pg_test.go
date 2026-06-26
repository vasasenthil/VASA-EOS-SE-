package integration

import (
	"os"
	"testing"

	"github.com/vasa-eos-se-tn/platform/audit"
)

// TestPgAuditDurable proves the tamper-evident audit hash-chain persists to PostgreSQL: records survive a fresh
// log instance, the chain continues correctly, it re-verifies, and a tampered persisted chain is rejected at
// startup. Runs only with DATABASE_URL set.
func TestPgAuditDurable(t *testing.T) {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		t.Skip("DATABASE_URL not set; durable PostgreSQL audit test runs against a live database only")
	}
	sink, err := newPgAuditSink(dsn)
	if err != nil {
		t.Fatalf("connect/migrate: %v", err)
	}
	if _, err := sink.db.Exec(`DELETE FROM audit_chain`); err != nil {
		t.Fatalf("cleanup: %v", err)
	}

	// append three records through a durable log.
	l1, err := audit.NewWithSink(sink)
	if err != nil {
		t.Fatalf("new: %v", err)
	}
	for _, a := range []string{"fund.release", "pii.process", "offswitch.engage"} {
		if _, err := l1.Append(audit.Entry{Action: a, Actor: "SEC", TS: "2026-06-21T00:00:00Z"}); err != nil {
			t.Fatalf("append %s: %v", a, err)
		}
	}
	head1 := l1.Head()

	// a brand-new log over the same database reloads + re-verifies the chain and continues from its head.
	l2, err := audit.NewWithSink(sink)
	if err != nil {
		t.Fatalf("reload: %v", err)
	}
	if l2.Len() != 3 || l2.Head() != head1 {
		t.Fatalf("chain not durable: len=%d head=%s want head=%s", l2.Len(), l2.Head(), head1)
	}
	r, err := l2.Append(audit.Entry{Action: "audit.read", Actor: "CAG", TS: "2026-06-21T00:01:00Z"})
	if err != nil || r.Seq != 4 {
		t.Fatalf("durable chain did not continue: %+v err=%v", r, err)
	}
	if bad, err := l2.Verify(); err != nil {
		t.Fatalf("durable chain must verify: bad=%d err=%v", bad, err)
	}

	// directly tamper with a persisted row, then prove a fresh load is rejected (fail-closed at startup).
	if _, err := sink.db.Exec(`UPDATE audit_chain SET detail='forged' WHERE seq=2`); err != nil {
		t.Fatalf("tamper: %v", err)
	}
	if _, err := audit.NewWithSink(sink); err == nil {
		t.Fatal("a tampered persisted audit chain must be rejected at startup")
	}
}

// TestPgAuditPlatformDurable proves the PLATFORM's audit log (the one every workflow writes to) is durable: two
// platforms over the same database share one continuous, verifiable chain.
func TestPgAuditPlatformDurable(t *testing.T) {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		t.Skip("DATABASE_URL not set; durable platform-audit test runs against a live database only")
	}
	sink, err := newPgAuditSink(dsn)
	if err != nil {
		t.Fatalf("sink: %v", err)
	}
	if _, err := sink.db.Exec(`DELETE FROM audit_chain`); err != nil {
		t.Fatalf("cleanup: %v", err)
	}

	p1 := newPlatform(t)
	p1.appendAudit("role:SECRETARY", "leave.decide", "LV-1", "approved", "status=approved")
	n1 := p1.Audit.Len()
	if n1 == 0 {
		t.Fatal("expected at least one audit record")
	}

	// a second platform reuses the same persisted chain and verifies it.
	p2 := newPlatform(t)
	if p2.Audit.Len() < n1 {
		t.Fatalf("second platform must inherit the persisted chain: %d < %d", p2.Audit.Len(), n1)
	}
	if _, err := p2.Audit.Verify(); err != nil {
		t.Fatalf("inherited platform chain must verify: %v", err)
	}
}
