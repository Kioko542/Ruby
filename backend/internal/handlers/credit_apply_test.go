package handlers

import "testing"

func TestApplyCreditDeltaClampsAtZero(t *testing.T) {
	if applyCreditDelta(3, -5) != 0 {
		t.Fatalf("expected clamp to 0, got %d", applyCreditDelta(3, -5))
	}
	if applyCreditDelta(100, -5) != 95 {
		t.Fatalf("expected 95, got %d", applyCreditDelta(100, -5))
	}
	if applyCreditDelta(0, 10) != 10 {
		t.Fatalf("expected 10, got %d", applyCreditDelta(0, 10))
	}
}
