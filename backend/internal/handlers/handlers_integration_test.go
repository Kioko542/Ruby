package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/dev3pack/ruby/backend/internal/config"
	"github.com/dev3pack/ruby/backend/internal/web3"
	"github.com/go-chi/chi/v5"
)

func TestHealthEndpoint(t *testing.T) {
	h := &Handler{}
	r := chi.NewRouter()
	r.Get("/health", h.Health)

	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	rr := httptest.NewRecorder()
	r.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}

	var payload map[string]string
	if err := json.Unmarshal(rr.Body.Bytes(), &payload); err != nil {
		t.Fatalf("failed to parse JSON: %v", err)
	}
	if payload["status"] != "ok" || payload["service"] != "ruby-backend" {
		t.Fatalf("unexpected health payload: %+v", payload)
	}
}

func TestSolanaWalletBalanceEndpoint(t *testing.T) {
	rpc := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"jsonrpc":"2.0","id":1,"result":{"context":{"slot":1},"value":2000000000}}`))
	}))
	defer rpc.Close()

	h := &Handler{
		Config: &config.Config{SolanaRPCURL: rpc.URL},
		Web3:   web3.NewClient(rpc.URL),
	}

	router := chi.NewRouter()
	router.Get("/api/v1/web3/balance", h.SolanaWalletBalance)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/web3/balance?address=wallet111", nil)
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}

	var payload map[string]any
	if err := json.Unmarshal(rr.Body.Bytes(), &payload); err != nil {
		t.Fatalf("failed to parse JSON: %v", err)
	}
	if payload["address"] != "wallet111" {
		t.Fatalf("unexpected address: %+v", payload)
	}
}

func TestSolanaWalletBalanceEndpointMissingAddress(t *testing.T) {
	h := &Handler{
		Config: &config.Config{SolanaRPCURL: "http://example.invalid"},
		Web3:   web3.NewClient("http://example.invalid"),
	}

	router := chi.NewRouter()
	router.Get("/api/v1/web3/balance", h.SolanaWalletBalance)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/web3/balance", nil)
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rr.Code)
	}
}
