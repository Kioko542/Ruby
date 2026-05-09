package realtime

import (
	"encoding/json"
	"sync"
	"time"
)

type Event struct {
	Type      string         `json:"type"`
	Timestamp time.Time      `json:"timestamp"`
	Payload   map[string]any `json:"payload"`
}

type Hub struct {
	mu     sync.RWMutex
	omni   map[chan []byte]struct{}
	groups map[string]map[chan []byte]struct{}
}

func NewHub() *Hub {
	return &Hub{
		omni:   map[chan []byte]struct{}{},
		groups: map[string]map[chan []byte]struct{}{},
	}
}

// Subscribe registers an omnichannel subscriber (receives Broadcast + BroadcastGroup).
func (h *Hub) Subscribe() (chan []byte, func()) {
	return h.subscribeOmni()
}

func (h *Hub) subscribeOmni() (chan []byte, func()) {
	ch := make(chan []byte, 32)
	h.mu.Lock()
	h.omni[ch] = struct{}{}
	h.mu.Unlock()

	cancel := func() {
		h.mu.Lock()
		delete(h.omni, ch)
		h.mu.Unlock()
		close(ch)
	}
	return ch, cancel
}

// SubscribeGroup registers a subscriber scoped to one savings group (BroadcastGroup only).
func (h *Hub) SubscribeGroup(groupID string) (chan []byte, func()) {
	ch := make(chan []byte, 32)
	h.mu.Lock()
	if h.groups[groupID] == nil {
		h.groups[groupID] = map[chan []byte]struct{}{}
	}
	h.groups[groupID][ch] = struct{}{}
	h.mu.Unlock()

	cancel := func() {
		h.mu.Lock()
		if subs, ok := h.groups[groupID]; ok {
			delete(subs, ch)
			if len(subs) == 0 {
				delete(h.groups, groupID)
			}
		}
		h.mu.Unlock()
		close(ch)
	}
	return ch, cancel
}

func (h *Hub) Broadcast(evtType string, payload map[string]any) {
	raw, ok := marshalEvent(evtType, payload)
	if !ok {
		return
	}
	h.mu.RLock()
	defer h.mu.RUnlock()
	for ch := range h.omni {
		select {
		case ch <- raw:
		default:
		}
	}
}

// BroadcastGroup notifies omnichannel subscribers and all listeners for groupID.
func (h *Hub) BroadcastGroup(groupID string, evtType string, payload map[string]any) {
	raw, ok := marshalEvent(evtType, payload)
	if !ok {
		return
	}

	h.mu.RLock()
	defer h.mu.RUnlock()

	for ch := range h.omni {
		select {
		case ch <- raw:
		default:
		}
	}
	if subs, ok := h.groups[groupID]; ok {
		for ch := range subs {
			select {
			case ch <- raw:
			default:
			}
		}
	}
}

func marshalEvent(evtType string, payload map[string]any) ([]byte, bool) {
	evt := Event{
		Type:      evtType,
		Timestamp: time.Now().UTC(),
		Payload:   payload,
	}
	raw, err := json.Marshal(evt)
	if err != nil {
		return nil, false
	}
	return raw, true
}
