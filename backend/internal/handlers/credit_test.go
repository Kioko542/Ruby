package handlers_test

import (
	"testing"
	"time"

	"github.com/dev3pack/ruby/backend/internal/handlers"
)

func TestCreditDeltaDeadline(t *testing.T) {
	deadline := time.Date(2026, 5, 10, 12, 0, 0, 0, time.UTC)
	d, _ := handlers.CreditDeltaForContribution(deadline.Add(-time.Hour), &deadline, nil)
	if d != 10 {
		t.Fatalf("expected +10 before deadline, got %d", d)
	}
	d2, _ := handlers.CreditDeltaForContribution(deadline.Add(time.Hour), &deadline, nil)
	if d2 != -5 {
		t.Fatalf("expected -5 after deadline, got %d", d2)
	}
}

func TestCreditDeltaNoDeadlineClient(t *testing.T) {
	on := true
	off := false
	d, _ := handlers.CreditDeltaForContribution(time.Now().UTC(), nil, &on)
	if d != 10 {
		t.Fatalf("expected +10, got %d", d)
	}
	d2, _ := handlers.CreditDeltaForContribution(time.Now().UTC(), nil, &off)
	if d2 != -5 {
		t.Fatalf("expected -5, got %d", d2)
	}
	d3, _ := handlers.CreditDeltaForContribution(time.Now().UTC(), nil, nil)
	if d3 != 10 {
		t.Fatalf("expected +10 default without deadline, got %d", d3)
	}
}
