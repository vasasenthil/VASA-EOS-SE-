// Package audit implements the VASA-EOS(SE) TN immutable audit log (CC-SPEC-001 §17.6, §2.10).
//
// Every governance-significant action (a policy decision, a fund release, an off-switch approval, a PII
// access) is appended here. The log is a hash chain: each record commits to the previous record's hash, so
// any modification, deletion, truncation, or reordering of history is detectable by re-walking the chain.
// A Merkle root over the records gives a single commitment that can be anchored externally (the Hyperledger
// Besu notary network, BLOCKERS B-020) so even the platform operator cannot rewrite the past undetectably.
// Stdlib-only and append-only.
package audit

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"sync"
)

// Record is one immutable audit entry. Hash and PrevHash form the chain; they are computed, not supplied.
type Record struct {
	Seq      uint64 `json:"seq"`
	TS       string `json:"ts"`       // RFC3339Nano, supplied by the caller (a trusted clock)
	Actor    string `json:"actor"`    // subject id / service identity
	Action   string `json:"action"`   // e.g. "fund.release", "pii.process", "offswitch.engage"
	Resource string `json:"resource"` // target id
	Effect   string `json:"effect"`   // permit | deny | require-approval | executed
	Detail   string `json:"detail"`   // free-form context (governing rule ids, amounts, …)
	PrevHash string `json:"prev_hash"`
	Hash     string `json:"hash"`
}

// payload is the canonical, hash-covered content of a record (everything except Hash itself).
func (r Record) payload() []byte {
	b, _ := json.Marshal(struct {
		Seq                                         uint64
		TS, Actor, Action, Resource, Effect, Detail string
		PrevHash                                    string
	}{r.Seq, r.TS, r.Actor, r.Action, r.Resource, r.Effect, r.Detail, r.PrevHash})
	return b
}

func (r Record) computeHash() string {
	sum := sha256.Sum256(r.payload())
	return hex.EncodeToString(sum[:])
}

const genesisPrev = "0000000000000000000000000000000000000000000000000000000000000000"

// Entry is the caller-supplied content of an audit record (the chain fields are filled in by Append).
type Entry struct {
	TS       string
	Actor    string
	Action   string
	Resource string
	Effect   string
	Detail   string
}

// Log is an append-only, tamper-evident audit log. Safe for concurrent use.
type Log struct {
	mu      sync.Mutex
	records []Record
	sink    Sink // optional durability backend (nil = in-memory only)
}

// Sink is an optional durability backend for the log: it persists every sealed record and can reload the
// existing chain on startup. Implementations live outside this (pure) package — e.g. a PostgreSQL sink in the
// integration layer — so the audit log survives process restarts while staying tamper-evident.
type Sink interface {
	Persist(Record) error
	Load() ([]Record, error)
}

// New constructs an empty in-memory log.
func New() *Log { return &Log{} }

// NewWithSink constructs a log backed by a durability sink: it loads and VERIFIES the persisted chain, then
// continues appending from its head. A tampered or broken persisted chain is rejected at startup (fail-closed).
func NewWithSink(s Sink) (*Log, error) {
	l := &Log{sink: s}
	if s == nil {
		return l, nil
	}
	recs, err := s.Load()
	if err != nil {
		return nil, fmt.Errorf("audit: load persisted chain: %w", err)
	}
	if _, err := Verify(recs); err != nil {
		return nil, fmt.Errorf("audit: persisted chain failed verification: %w", err)
	}
	l.records = recs
	return l, nil
}

// Append adds an entry, chaining it to the current head, and returns the sealed record. When a durability sink
// is configured the record is persisted before it is acknowledged; a persistence failure rolls back the
// in-memory append so memory and storage never diverge.
func (l *Log) Append(e Entry) (Record, error) {
	if e.Action == "" {
		return Record{}, errors.New("audit: action required")
	}
	l.mu.Lock()
	defer l.mu.Unlock()

	prev := genesisPrev
	var seq uint64 = 1
	if n := len(l.records); n > 0 {
		prev = l.records[n-1].Hash
		seq = l.records[n-1].Seq + 1
	}
	r := Record{
		Seq: seq, TS: e.TS, Actor: e.Actor, Action: e.Action,
		Resource: e.Resource, Effect: e.Effect, Detail: e.Detail, PrevHash: prev,
	}
	r.Hash = r.computeHash()
	if l.sink != nil {
		if err := l.sink.Persist(r); err != nil {
			return Record{}, fmt.Errorf("audit: persist: %w", err)
		}
	}
	l.records = append(l.records, r)
	return r, nil
}

// Records returns a copy of the chain.
func (l *Log) Records() []Record {
	l.mu.Lock()
	defer l.mu.Unlock()
	out := make([]Record, len(l.records))
	copy(out, l.records)
	return out
}

// Len returns the number of records.
func (l *Log) Len() int {
	l.mu.Lock()
	defer l.mu.Unlock()
	return len(l.records)
}

// Head returns the current head hash (the single value an external notary anchors), or genesis if empty.
func (l *Log) Head() string {
	l.mu.Lock()
	defer l.mu.Unlock()
	if len(l.records) == 0 {
		return genesisPrev
	}
	return l.records[len(l.records)-1].Hash
}

// Verify re-walks an ordered slice of records and confirms the chain is intact: sequence is contiguous from
// 1, each record's stored Hash equals the recomputed hash of its payload, and each PrevHash links to the
// prior record's Hash. Returns the index of the first broken record (or -1) plus an error.
func Verify(records []Record) (badIndex int, err error) {
	prev := genesisPrev
	for i, r := range records {
		if r.Seq != uint64(i+1) {
			return i, fmt.Errorf("seq discontinuity at index %d: got %d, want %d", i, r.Seq, i+1)
		}
		if r.PrevHash != prev {
			return i, fmt.Errorf("broken link at seq %d: prev_hash does not match the prior record", r.Seq)
		}
		if r.computeHash() != r.Hash {
			return i, fmt.Errorf("tampered record at seq %d: content does not match its hash", r.Seq)
		}
		prev = r.Hash
	}
	return -1, nil
}

// Verify validates this log's own records.
func (l *Log) Verify() (int, error) { return Verify(l.Records()) }

// MerkleRoot computes a deterministic Merkle root over the record hashes (duplicating the last leaf on odd
// levels). The root is the commitment anchored to the external notary network for non-repudiation.
func (l *Log) MerkleRoot() string {
	recs := l.Records()
	if len(recs) == 0 {
		return genesisPrev
	}
	level := make([][]byte, len(recs))
	for i, r := range recs {
		h, _ := hex.DecodeString(r.Hash)
		level[i] = h
	}
	for len(level) > 1 {
		var next [][]byte
		for i := 0; i < len(level); i += 2 {
			left := level[i]
			right := left
			if i+1 < len(level) {
				right = level[i+1]
			}
			h := sha256.New()
			h.Write(left)
			h.Write(right)
			next = append(next, h.Sum(nil))
		}
		level = next
	}
	return hex.EncodeToString(level[0])
}
