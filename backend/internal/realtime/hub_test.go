package realtime_test

import (
	"encoding/json"
	"testing"
	"time"

	"github.com/dev3pack/ruby/backend/internal/realtime"
)

func recvTimeout(t *testing.T, ch <-chan []byte) realtime.Event {
	t.Helper()
	select {
	case raw := <-ch:
		var e realtime.Event
		if err := json.Unmarshal(raw, &e); err != nil {
			t.Fatalf("unmarshal: %v", err)
		}
		return e
	case <-time.After(2 * time.Second):
		t.Fatal("timeout waiting for event")
		panic("unreachable")
	}
}

func TestHubOmniReceivesBroadcastAndBroadcastGroup(t *testing.T) {
	h := realtime.NewHub()
	ch, cancel := h.Subscribe()
	defer cancel()

	go func() {
		h.Broadcast("ping", map[string]any{"x": 1})
		h.BroadcastGroup("g1", "yield", map[string]any{"y": 2})
	}()

	e1 := recvTimeout(t, ch)
	e2 := recvTimeout(t, ch)
	if e1.Type != "ping" || e2.Type != "yield" {
		t.Fatalf("unexpected order/types: %s %s", e1.Type, e2.Type)
	}
}

func TestHubGroupSubscriberOnlyGetsGroupScopedBroadcastGroup(t *testing.T) {
	h := realtime.NewHub()
	ch, cancel := h.SubscribeGroup("g1")
	defer cancel()

	go func() {
		h.Broadcast("global_only", map[string]any{})
		h.BroadcastGroup("g2", "other", map[string]any{})
		h.BroadcastGroup("g1", "mine", map[string]any{})
	}()

	e := recvTimeout(t, ch)
	if e.Type != "mine" {
		t.Fatalf("expected mine, got %s payload=%v", e.Type, e.Payload)
	}
}
