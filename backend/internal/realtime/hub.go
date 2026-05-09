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
	mu      sync.RWMutex
	clients map[chan []byte]struct{}
}

func NewHub() *Hub {
	return &Hub{
		clients: map[chan []byte]struct{}{},
	}
}

func (h *Hub) Subscribe() (chan []byte, func()) {
	ch := make(chan []byte, 16)
	h.mu.Lock()
	h.clients[ch] = struct{}{}
	h.mu.Unlock()

	cancel := func() {
		h.mu.Lock()
		delete(h.clients, ch)
		h.mu.Unlock()
		close(ch)
	}
	return ch, cancel
}

func (h *Hub) Broadcast(evtType string, payload map[string]any) {
	evt := Event{
		Type:      evtType,
		Timestamp: time.Now().UTC(),
		Payload:   payload,
	}
	raw, err := json.Marshal(evt)
	if err != nil {
		return
	}

	h.mu.RLock()
	defer h.mu.RUnlock()
	for ch := range h.clients {
		select {
		case ch <- raw:
		default:
		}
	}
}
