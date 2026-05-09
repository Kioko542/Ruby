package db_test

import (
	"testing"

	"github.com/dev3pack/ruby/backend/internal/db"
)

func TestOpenEmptyDSN(t *testing.T) {
	_, err := db.Open("")
	if err == nil {
		t.Fatal("expected error for empty DSN")
	}
}

func TestOpenInvalidHost(t *testing.T) {
	_, err := db.Open("postgres://user:pass@127.0.0.1:9/nodb?sslmode=disable")
	if err == nil {
		t.Fatal("expected connection error")
	}
}
