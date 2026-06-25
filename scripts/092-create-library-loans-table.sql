-- VASA-EOS(SE) TN — School Library circulation durable store (L6 library service / platformd).
-- Backs platform/integration/library_pg.go. Each row is a circulation record (a physical copy issued to a
-- member). The one-copy-one-borrower invariant — a single physical copy can be on loan to at most one member
-- at a time — is enforced both by the adapter's pre-insert existence check AND by the partial unique index
-- below. Applied by the adapter's ensureSchema(); kept here as the migration of record.
CREATE TABLE IF NOT EXISTS library_loans (
    id          TEXT PRIMARY KEY,              -- loan id
    org_unit    TEXT NOT NULL,                 -- the school library (T6 tenancy node)
    book_id     TEXT NOT NULL,                 -- catalogue id / ISBN
    title       TEXT NOT NULL DEFAULT '',
    copy_id     TEXT NOT NULL,                 -- the physical copy barcode (unique within a library)
    member_id   TEXT NOT NULL,                 -- borrower (synthetic student/teacher id)
    issued_on   TEXT NOT NULL,                 -- YYYY-MM-DD
    due_on      TEXT NOT NULL,                 -- YYYY-MM-DD (issued + 14 days, extended on renewal)
    returned_on TEXT NOT NULL DEFAULT '',      -- YYYY-MM-DD when returned
    status      TEXT NOT NULL,                 -- on_loan | returned | lost
    renewals    INT  NOT NULL DEFAULT 0        -- capped at 2
);
CREATE INDEX IF NOT EXISTS library_member_idx ON library_loans (member_id);
-- at most one active loan per physical copy (the one-copy-one-borrower invariant, enforced in the schema).
CREATE UNIQUE INDEX IF NOT EXISTS library_copy_active_idx ON library_loans (org_unit, copy_id) WHERE status='on_loan';
