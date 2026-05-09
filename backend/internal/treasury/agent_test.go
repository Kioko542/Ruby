package treasury

import (
	"context"
	"testing"

	"github.com/dev3pack/ruby/backend/internal/models"
)

func TestRunOnceRejectsInvalidDeployPercent(t *testing.T) {
	cfg := AgentConfig{
		MinReserveLamports: 100,
		DeployPercent:      0,
		KaminoAPYBps:       700,
		JitoAPYBps:         650,
	}

	_, err := RunOnce(context.Background(), nil, cfg, models.Group{ID: "g1", VaultBalance: 1000}, true)
	if err == nil {
		t.Fatal("expected error for invalid deploy percent, got nil")
	}
}

func TestRunOnceSkipsWhenBelowReserve(t *testing.T) {
	cfg := AgentConfig{
		MinReserveLamports: 1_000,
		DeployPercent:      90,
		KaminoAPYBps:       700,
		JitoAPYBps:         650,
	}

	res, err := RunOnce(context.Background(), nil, cfg, models.Group{ID: "g1", VaultBalance: 900}, true)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if res.Status != "skipped" {
		t.Fatalf("expected skipped status, got %s", res.Status)
	}
}

func TestRunOnceDryRunPicksHigherAPYAndCalculatesDeposit(t *testing.T) {
	cfg := AgentConfig{
		MinReserveLamports: 100,
		DeployPercent:      90,
		KaminoAPYBps:       650,
		JitoAPYBps:         800,
	}

	res, err := RunOnce(context.Background(), nil, cfg, models.Group{ID: "g2", VaultBalance: 1_100}, true)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if res.Status != "dry_run" {
		t.Fatalf("expected dry_run status, got %s", res.Status)
	}
	if res.SelectedProtocol != "jito" {
		t.Fatalf("expected protocol jito, got %s", res.SelectedProtocol)
	}
	// excess = 1000, deploy 90% => 900
	if res.DepositedLamports != 900 {
		t.Fatalf("expected deposited lamports 900, got %d", res.DepositedLamports)
	}
}
