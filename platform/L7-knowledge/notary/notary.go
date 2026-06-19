// Package notary is the L7.2 blockchain-notary ledger (CC-SPEC-001 §7.2, §17.6).
//
// Trust anchors — the L5 audit Merkle root, issued-credential hashes, fund-flow attestations — are anchored
// here so their existence at a point in time is provable and tamper-evident to anyone, including against the
// platform operator. Each block commits to a Merkle root over the items anchored in it AND to the previous
// block's hash (a hash chain). An item's presence is proven by a Merkle inclusion proof that a verifier
// checks against the block root without trusting the ledger.
//
// In production the anchor target is the Hyperledger Besu validator network (CAG / IIT-M / Anna Univ as
// validators, BLOCKERS B-020); this package is the verifiable ledger logic + the Besu submission seam.
// Stdlib-only.
package notary

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"time"
)

// HashItem returns the leaf hash of an arbitrary payload (hex SHA-256).
func HashItem(payload []byte) string {
	sum := sha256.Sum256(payload)
	return hex.EncodeToString(sum[:])
}

// Block is one notarised block.
type Block struct {
	Index      int
	TS         string
	PrevHash   string
	Leaves     []string // the leaf hashes anchored in this block (in order)
	MerkleRoot string
	Hash       string // SHA-256 over (Index, PrevHash, MerkleRoot, TS)
}

const genesisPrev = "0000000000000000000000000000000000000000000000000000000000000000"

func blockHash(index int, prev, root, ts string) string {
	h := sha256.New()
	h.Write([]byte(itoa(index)))
	h.Write([]byte{0})
	h.Write([]byte(prev))
	h.Write([]byte{0})
	h.Write([]byte(root))
	h.Write([]byte{0})
	h.Write([]byte(ts))
	return hex.EncodeToString(h.Sum(nil))
}

func itoa(n int) string {
	if n == 0 {
		return "0"
	}
	neg := n < 0
	if neg {
		n = -n
	}
	var b []byte
	for n > 0 {
		b = append([]byte{byte('0' + n%10)}, b...)
		n /= 10
	}
	if neg {
		b = append([]byte{'-'}, b...)
	}
	return string(b)
}

// Ledger is an append-only chain of notarised blocks.
type Ledger struct {
	blocks []Block
	now    func() time.Time
}

// New builds an empty ledger.
func New() *Ledger { return &Ledger{now: time.Now} }

// Anchor notarises a batch of leaf hashes into a new block and returns it. At least one leaf is required.
func (l *Ledger) Anchor(leaves []string) (Block, error) {
	if len(leaves) == 0 {
		return Block{}, errors.New("notary: at least one item is required to anchor")
	}
	prev := genesisPrev
	if n := len(l.blocks); n > 0 {
		prev = l.blocks[n-1].Hash
	}
	root := merkleRoot(leaves)
	ts := l.now().UTC().Format(time.RFC3339Nano)
	b := Block{
		Index:      len(l.blocks),
		TS:         ts,
		PrevHash:   prev,
		Leaves:     append([]string{}, leaves...),
		MerkleRoot: root,
		Hash:       blockHash(len(l.blocks), prev, root, ts),
	}
	l.blocks = append(l.blocks, b)
	return b, nil
}

// Head returns the latest block hash, or genesis if empty.
func (l *Ledger) Head() string {
	if len(l.blocks) == 0 {
		return genesisPrev
	}
	return l.blocks[len(l.blocks)-1].Hash
}

// Len returns the number of blocks.
func (l *Ledger) Len() int { return len(l.blocks) }

// Verify re-walks the chain: each block's prev-link and recomputed hash must hold.
func (l *Ledger) Verify() error {
	prev := genesisPrev
	for i, b := range l.blocks {
		if b.Index != i {
			return errors.New("notary: block index discontinuity")
		}
		if b.PrevHash != prev {
			return errors.New("notary: broken chain link")
		}
		if merkleRoot(b.Leaves) != b.MerkleRoot {
			return errors.New("notary: merkle root does not match block leaves (tamper)")
		}
		if blockHash(b.Index, b.PrevHash, b.MerkleRoot, b.TS) != b.Hash {
			return errors.New("notary: block hash mismatch (tamper)")
		}
		prev = b.Hash
	}
	return nil
}

// Proof is a Merkle inclusion proof for a leaf in a block.
type Proof struct {
	BlockIndex int
	Leaf       string
	Siblings   []string // sibling hashes from leaf to root
	Left       []bool   // for each level, true if the sibling is on the LEFT
	Root       string
}

// Prove builds an inclusion proof that leaf is in block blockIndex.
func (l *Ledger) Prove(blockIndex int, leaf string) (Proof, error) {
	if blockIndex < 0 || blockIndex >= len(l.blocks) {
		return Proof{}, errors.New("notary: block index out of range")
	}
	b := l.blocks[blockIndex]
	idx := -1
	for i, lf := range b.Leaves {
		if lf == leaf {
			idx = i
			break
		}
	}
	if idx < 0 {
		return Proof{}, errors.New("notary: leaf not found in block")
	}
	level := append([]string{}, b.Leaves...)
	var siblings []string
	var left []bool
	for len(level) > 1 {
		var next []string
		for i := 0; i < len(level); i += 2 {
			l0 := level[i]
			r0 := l0
			if i+1 < len(level) {
				r0 = level[i+1]
			}
			next = append(next, hashPair(l0, r0))
		}
		sib := idx ^ 1 // sibling index
		if sib >= len(level) {
			sib = idx // duplicated last node is its own sibling
		}
		siblings = append(siblings, level[sib])
		left = append(left, sib < idx) // sibling on the left?
		idx /= 2
		level = next
	}
	return Proof{BlockIndex: blockIndex, Leaf: leaf, Siblings: siblings, Left: left, Root: b.MerkleRoot}, nil
}

// VerifyProof recomputes the root from the leaf + proof and checks it matches the claimed root.
func VerifyProof(p Proof) bool {
	cur := p.Leaf
	for i, sib := range p.Siblings {
		if p.Left[i] {
			cur = hashPair(sib, cur)
		} else {
			cur = hashPair(cur, sib)
		}
	}
	return cur == p.Root
}

// merkleRoot computes a Merkle root over leaf hashes (duplicating the last node on odd levels).
func merkleRoot(leaves []string) string {
	if len(leaves) == 0 {
		return genesisPrev
	}
	level := append([]string{}, leaves...)
	for len(level) > 1 {
		var next []string
		for i := 0; i < len(level); i += 2 {
			l0 := level[i]
			r0 := l0
			if i+1 < len(level) {
				r0 = level[i+1]
			}
			next = append(next, hashPair(l0, r0))
		}
		level = next
	}
	return level[0]
}

func hashPair(a, b string) string {
	h := sha256.New()
	h.Write([]byte(a))
	h.Write([]byte(b))
	return hex.EncodeToString(h.Sum(nil))
}
