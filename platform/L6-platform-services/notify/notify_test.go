package notify

import (
	"context"
	"errors"
	"testing"

	"github.com/vasa-eos-se-tn/platform/i18n"
)

func cat() *i18n.Catalogue {
	c := i18n.New(i18n.En)
	c.Load(i18n.En, map[string]string{"admission.review": "Application {id} needs your review."})
	c.Load(i18n.Ta, map[string]string{"admission.review": "விண்ணப்பம் {id} உங்கள் பரிசீலனை தேவை."})
	return c
}

func newD(t *testing.T) (*Dispatcher, *InboxSender) {
	t.Helper()
	d, err := New(cat())
	if err != nil {
		t.Fatal(err)
	}
	in := NewInboxSender()
	d.Register(Inbox, in)
	return d, in
}

func TestDispatchRendersAndRoutes(t *testing.T) {
	d, in := newD(t)
	n, deduped, err := d.Dispatch(context.Background(), Request{To: "DEO", Channel: Inbox, Key: "admission.review", Vars: map[string]string{"id": "STU-9"}, Locale: i18n.En})
	if err != nil || deduped {
		t.Fatalf("first dispatch: err=%v deduped=%v", err, deduped)
	}
	if n.Body != "Application STU-9 needs your review." {
		t.Fatalf("body not rendered: %q", n.Body)
	}
	if got := in.For("DEO"); len(got) != 1 {
		t.Fatalf("inbox should hold 1 message for DEO, got %d", len(got))
	}
}

func TestLocalisedBody(t *testing.T) {
	d, _ := newD(t)
	n, _, _ := d.Dispatch(context.Background(), Request{To: "DEO", Channel: Inbox, Key: "admission.review", Vars: map[string]string{"id": "STU-9"}, Locale: i18n.Ta})
	if n.Body != "விண்ணப்பம் STU-9 உங்கள் பரிசீலனை தேவை." {
		t.Fatalf("tamil body wrong: %q", n.Body)
	}
}

func TestIdempotentDispatch(t *testing.T) {
	d, in := newD(t)
	req := Request{To: "DEO", Channel: Inbox, Key: "admission.review", Vars: map[string]string{"id": "X"}, Locale: i18n.En, IdemKey: "review:X"}
	d.Dispatch(context.Background(), req)
	_, deduped, _ := d.Dispatch(context.Background(), req) // replay
	if !deduped {
		t.Fatal("a replayed dispatch must be deduped")
	}
	if len(in.Inbox()) != 1 || d.Count() != 1 {
		t.Fatalf("only one message should be delivered; inbox=%d count=%d", len(in.Inbox()), d.Count())
	}
}

func TestUnknownChannelErrors(t *testing.T) {
	d, _ := newD(t)
	if _, _, err := d.Dispatch(context.Background(), Request{To: "x", Channel: SMS, Key: "admission.review", Locale: i18n.En}); err == nil {
		t.Fatal("dispatch to an unregistered channel must error")
	}
}

type failSender struct{}

func (failSender) Send(context.Context, Notification) error { return errors.New("down") }

func TestSenderFailureNotMarkedSent(t *testing.T) {
	d, _ := newD(t)
	d.Register(SMS, failSender{})
	req := Request{To: "x", Channel: SMS, Key: "admission.review", Locale: i18n.En, IdemKey: "k"}
	if _, _, err := d.Dispatch(context.Background(), req); err == nil {
		t.Fatal("a failed send must surface an error")
	}
	// because it failed, the idem key is not marked → a retry is allowed (and here will fail again)
	if _, deduped, _ := d.Dispatch(context.Background(), req); deduped {
		t.Fatal("a failed dispatch must remain retryable (not deduped)")
	}
}

func TestValidation(t *testing.T) {
	if _, err := New(nil); err == nil {
		t.Fatal("nil catalogue must error")
	}
	d, _ := newD(t)
	if _, _, err := d.Dispatch(context.Background(), Request{Channel: Inbox, Key: "k"}); err == nil {
		t.Fatal("missing recipient must error")
	}
}
