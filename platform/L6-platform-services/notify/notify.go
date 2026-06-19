// Package notify is the L6 notification dispatch service (CC-SPEC-001 §10.5). A request names a recipient, a
// channel, a message KEY and variables; the dispatcher renders the localised body via the i18n catalogue and
// routes it to the channel's sender. Delivery is idempotent on an idempotency key (a retried dispatch does
// not double-send), and every dispatch is recorded. Channels are seams (inbox / sms / email); the in-process
// InboxSender captures messages for a role-gated inbox surface. Stdlib-only, safe for concurrent use.
package notify

import (
	"context"
	"errors"
	"fmt"
	"sync"

	"github.com/vasa-eos-se-tn/platform/i18n"
)

// Channel is a delivery channel.
type Channel string

const (
	Inbox Channel = "inbox"
	SMS   Channel = "sms"
	Email Channel = "email"
)

// Request is a notification to send.
type Request struct {
	To      string // recipient (role, user id, or address)
	Channel Channel
	Key     string            // i18n message key
	Vars    map[string]string // interpolation variables
	Locale  i18n.Locale
	IdemKey string // dedup key; empty disables dedup
}

// Notification is a rendered, dispatched message.
type Notification struct {
	To      string
	Channel Channel
	Body    string
	Key     string
}

// Sender delivers a rendered notification on its channel.
type Sender interface {
	Send(ctx context.Context, n Notification) error
}

// Dispatcher renders + routes notifications.
type Dispatcher struct {
	cat     *i18n.Catalogue
	senders map[Channel]Sender
	mu      sync.Mutex
	sent    map[string]bool
	count   int
}

// New builds a dispatcher over an i18n catalogue.
func New(cat *i18n.Catalogue) (*Dispatcher, error) {
	if cat == nil {
		return nil, errors.New("notify: catalogue required")
	}
	return &Dispatcher{cat: cat, senders: map[Channel]Sender{}, sent: map[string]bool{}}, nil
}

// Register wires a sender to a channel.
func (d *Dispatcher) Register(ch Channel, s Sender) { d.senders[ch] = s }

// Dispatch renders the localised body and sends it. deduped=true means the IdemKey was already delivered and
// nothing was re-sent.
func (d *Dispatcher) Dispatch(ctx context.Context, req Request) (n Notification, deduped bool, err error) {
	if req.To == "" || req.Key == "" {
		return Notification{}, false, errors.New("notify: recipient and key required")
	}
	sender, ok := d.senders[req.Channel]
	if !ok {
		return Notification{}, false, fmt.Errorf("notify: no sender for channel %q", req.Channel)
	}

	d.mu.Lock()
	if req.IdemKey != "" && d.sent[req.IdemKey] {
		d.mu.Unlock()
		return Notification{}, true, nil
	}
	d.mu.Unlock()

	body := d.cat.T(req.Locale, req.Key, req.Vars)
	n = Notification{To: req.To, Channel: req.Channel, Body: body, Key: req.Key}
	if err := sender.Send(ctx, n); err != nil {
		return Notification{}, false, fmt.Errorf("notify: send: %w", err)
	}

	d.mu.Lock()
	if req.IdemKey != "" {
		d.sent[req.IdemKey] = true
	}
	d.count++
	d.mu.Unlock()
	return n, false, nil
}

// Count returns the number of notifications actually dispatched (excludes dedups).
func (d *Dispatcher) Count() int {
	d.mu.Lock()
	defer d.mu.Unlock()
	return d.count
}

// InboxSender captures notifications in memory for a role-gated inbox surface.
type InboxSender struct {
	mu   sync.Mutex
	msgs []Notification
}

// NewInboxSender builds an empty inbox.
func NewInboxSender() *InboxSender { return &InboxSender{} }

// Send appends to the inbox.
func (s *InboxSender) Send(_ context.Context, n Notification) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.msgs = append(s.msgs, n)
	return nil
}

// Inbox returns a copy of all captured notifications.
func (s *InboxSender) Inbox() []Notification {
	s.mu.Lock()
	defer s.mu.Unlock()
	out := make([]Notification, len(s.msgs))
	copy(out, s.msgs)
	return out
}

// For returns the notifications addressed to a recipient.
func (s *InboxSender) For(to string) []Notification {
	s.mu.Lock()
	defer s.mu.Unlock()
	var out []Notification
	for _, n := range s.msgs {
		if n.To == to {
			out = append(out, n)
		}
	}
	return out
}
