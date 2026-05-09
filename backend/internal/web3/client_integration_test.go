package web3

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestGetBalanceLamportsSuccess(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"jsonrpc":"2.0","id":1,"result":{"context":{"slot":1},"value":123456789}}`))
	}))
	defer srv.Close()

	client := NewClient(srv.URL)
	lamports, err := client.GetBalanceLamports(context.Background(), "wallet111")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if lamports != 123456789 {
		t.Fatalf("expected 123456789 lamports, got %d", lamports)
	}
}

func TestGetBalanceLamportsRPCError(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"jsonrpc":"2.0","id":1,"error":{"code":-32000,"message":"bad request"}}`))
	}))
	defer srv.Close()

	client := NewClient(srv.URL)
	_, err := client.GetBalanceLamports(context.Background(), "wallet111")
	if err == nil {
		t.Fatal("expected rpc error, got nil")
	}
}
