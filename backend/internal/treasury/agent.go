package treasury

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/dev3pack/ruby/backend/internal/models"
	"github.com/uptrace/bun"
)

type AgentConfig struct {
	MinReserveLamports int64
	DeployPercent      int64
	KaminoAPYBps       int64
	JitoAPYBps         int64
}

type AgentResult struct {
	GroupID           string  `json:"group_id"`
	Status            string  `json:"status"`
	Reason            string  `json:"reason,omitempty"`
	SelectedProtocol  string  `json:"selected_protocol,omitempty"`
	SelectedAPY       float64 `json:"selected_apy,omitempty"`
	DepositedLamports int64   `json:"deposited_lamports,omitempty"`
}

func RunOnce(ctx context.Context, database *bun.DB, cfg AgentConfig, group models.Group, dryRun bool) (*AgentResult, error) {
	if cfg.DeployPercent <= 0 || cfg.DeployPercent > 100 {
		return nil, fmt.Errorf("DEPLOY_PERCENT must be between 1 and 100")
	}

	excess := group.VaultBalance - cfg.MinReserveLamports
	if excess <= 0 {
		return &AgentResult{
			GroupID: group.ID,
			Status:  "skipped",
			Reason:  "vault balance below reserve threshold",
		}, nil
	}

	deployAmount := (excess * cfg.DeployPercent) / 100
	if deployAmount <= 0 {
		return &AgentResult{
			GroupID: group.ID,
			Status:  "skipped",
			Reason:  "deploy amount resolved to zero",
		}, nil
	}

	selectedProtocol := "kamino"
	selectedAPY := float64(cfg.KaminoAPYBps) / 100.0
	if cfg.JitoAPYBps > cfg.KaminoAPYBps {
		selectedProtocol = "jito"
		selectedAPY = float64(cfg.JitoAPYBps) / 100.0
	}

	// Structured audit log used for cron traceability and post-mortem debugging.
	log.Printf(`{"component":"treasury-agent","group_id":"%s","vault_balance":%d,"reserve":%d,"deploy_amount":%d,"selected_protocol":"%s","selected_apy":%.2f,"dry_run":%t}`,
		group.ID, group.VaultBalance, cfg.MinReserveLamports, deployAmount, selectedProtocol, selectedAPY, dryRun)

	if dryRun {
		return &AgentResult{
			GroupID:           group.ID,
			Status:            "dry_run",
			SelectedProtocol:  selectedProtocol,
			SelectedAPY:       selectedAPY,
			DepositedLamports: deployAmount,
		}, nil
	}

	event := &models.YieldEvent{
		GroupID:         group.ID,
		AmountDeposited: deployAmount,
		Protocol:        selectedProtocol,
		APY:             selectedAPY,
		TxSignature:     fmt.Sprintf("simulated-%d", time.Now().UnixNano()),
		CreatedAt:       time.Now().UTC(),
	}
	if _, err := database.NewInsert().Model(event).Exec(ctx); err != nil {
		// Safe failure mode: skip state mutation when write fails.
		return &AgentResult{
			GroupID: group.ID,
			Status:  "failed",
			Reason:  "yield event write failed",
		}, err
	}

	group.VaultBalance -= deployAmount
	group.UpdatedAt = time.Now().UTC()
	if _, err := database.NewUpdate().
		Model(&group).
		Column("vault_balance", "updated_at").
		WherePK().
		Exec(ctx); err != nil {
		return &AgentResult{
			GroupID: group.ID,
			Status:  "failed",
			Reason:  "group vault update failed",
		}, err
	}

	return &AgentResult{
		GroupID:           group.ID,
		Status:            "executed",
		SelectedProtocol:  selectedProtocol,
		SelectedAPY:       selectedAPY,
		DepositedLamports: deployAmount,
	}, nil
}
