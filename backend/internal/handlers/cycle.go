package handlers

import (
	"context"
	"database/sql"
	"errors"
	"net/http"
	"sort"
	"strings"
	"time"

	"github.com/dev3pack/ruby/backend/internal/models"
	"github.com/go-chi/chi/v5"
)

// GetGroupCycle returns active cycle metadata and optional settlement preview.
func (h *Handler) GetGroupCycle(w http.ResponseWriter, r *http.Request) {
	groupID := strings.TrimSpace(chi.URLParam(r, "groupID"))
	if groupID == "" {
		writeError(w, http.StatusBadRequest, "groupID is required")
		return
	}

	ctx := context.Background()
	var group models.Group
	if err := h.DB.NewSelect().Model(&group).Where("id = ?", groupID).Scan(ctx); err != nil {
		writeError(w, http.StatusNotFound, "group not found")
		return
	}

	var settlements []models.CycleSettlement
	if group.PayoutReady && group.LastSettledCycle > 0 {
		if err := h.DB.NewSelect().
			Model(&settlements).
			Where("group_id = ?", groupID).
			Where("cycle_number = ?", group.LastSettledCycle).
			Order("member_id ASC").
			Scan(ctx); err != nil {
			writeError(w, http.StatusInternalServerError, "failed to load settlements")
			return
		}
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"group_id":           groupID,
		"vault_balance":      group.VaultBalance,
		"active_cycle":       group.ActiveCycle,
		"cycle_deadline":     group.CycleDeadline,
		"payout_ready":       group.PayoutReady,
		"last_settled_cycle": group.LastSettledCycle,
		"cycle_contribution": group.ContributionAmt,
		"settlements":        settlements,
		"settlement_note":    "Off-chain cycle settlement preview; treasury payout wiring is product-specific.",
	})
}

// EndGroupCycle settles the active cycle with pro-rata shares (mock payout).
func (h *Handler) EndGroupCycle(w http.ResponseWriter, r *http.Request) {
	groupID := strings.TrimSpace(chi.URLParam(r, "groupID"))
	if groupID == "" {
		writeError(w, http.StatusBadRequest, "groupID is required")
		return
	}

	ctx := context.Background()
	tx, err := h.DB.BeginTx(ctx, nil)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to start transaction")
		return
	}
	defer func() { _ = tx.Rollback() }()

	var group models.Group
	if err := tx.NewSelect().Model(&group).Where("id = ?", groupID).For("UPDATE").Scan(ctx); err != nil {
		writeError(w, http.StatusNotFound, "group not found")
		return
	}

	cycleNum := group.ActiveCycle
	var contribs []models.Contribution
	if err := tx.NewSelect().
		Model(&contribs).
		Where("group_id = ?", groupID).
		Where("cycle_number = ?", cycleNum).
		Scan(ctx); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to load contributions")
		return
	}

	memberTotals := map[string]int64{}
	for _, c := range contribs {
		memberTotals[c.MemberID] += c.Amount
	}

	var totalPool int64
	for _, v := range memberTotals {
		totalPool += v
	}

	if totalPool <= 0 {
		writeError(w, http.StatusBadRequest, "no contributions recorded for this cycle")
		return
	}

	vaultSnap := group.VaultBalance
	if vaultSnap < 0 {
		vaultSnap = 0
	}

	type shareRow struct {
		MemberID string `json:"member_id"`
		Wallet   string `json:"wallet_address"`
		Share    int64  `json:"share_lamports"`
		Contrib  int64  `json:"contributed_in_cycle"`
	}
	var rows []shareRow

	memberIDs := make([]string, 0, len(memberTotals))
	for mid := range memberTotals {
		memberIDs = append(memberIDs, mid)
	}
	sort.Strings(memberIDs)

	var allocated int64
	for i, mid := range memberIDs {
		amt := memberTotals[mid]
		var share int64
		if i == len(memberIDs)-1 {
			share = vaultSnap - allocated
			if share < 0 {
				share = 0
			}
		} else {
			share = amt * vaultSnap / totalPool
			allocated += share
		}

		var m models.Member
		if err := tx.NewSelect().Model(&m).Where("id = ?", mid).Where("group_id = ?", groupID).Scan(ctx); err != nil {
			writeError(w, http.StatusBadRequest, "member not found for contribution")
			return
		}

		rows = append(rows, shareRow{
			MemberID: mid,
			Wallet:   m.WalletAddress,
			Share:    share,
			Contrib:  amt,
		})

		settlement := &models.CycleSettlement{
			GroupID:        groupID,
			CycleNumber:    cycleNum,
			MemberID:       mid,
			WalletAddress:  m.WalletAddress,
			ShareLamports:  share,
			VaultSnapshot:  vaultSnap,
			TotalCyclePool: totalPool,
			CreatedAt:      time.Now().UTC(),
		}
		if _, err := tx.NewInsert().Model(settlement).Exec(ctx); err != nil {
			writeError(w, http.StatusInternalServerError, "failed to persist settlement")
			return
		}
	}

	group.LastSettledCycle = cycleNum
	group.ActiveCycle = cycleNum + 1
	group.PayoutReady = true
	deadline := time.Now().UTC().Add(7 * 24 * time.Hour)
	group.CycleDeadline = &deadline
	group.UpdatedAt = time.Now().UTC()

	if _, err := tx.NewUpdate().
		Model(&group).
		Column("last_settled_cycle", "active_cycle", "payout_ready", "cycle_deadline", "updated_at").
		WherePK().
		Exec(ctx); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to update group cycle")
		return
	}

	if err := tx.Commit(); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to commit cycle end")
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"group_id":           groupID,
		"settled_cycle":      cycleNum,
		"new_active_cycle":   group.ActiveCycle,
		"payout_ready":       true,
		"vault_snapshot":     vaultSnap,
		"total_cycle_pool":   totalPool,
		"member_allocations": rows,
	})

	h.publishCycleEnded(groupID, map[string]any{
		"group_id":          groupID,
		"settled_cycle":     cycleNum,
		"new_active_cycle":  group.ActiveCycle,
		"payout_ready":      true,
		"member_count":      len(rows),
	})
}

func (h *Handler) applyWebhookContribution(ctx context.Context, op webhookContributionOp) error {
	if op.Signature != "" {
		n, err := h.DB.NewSelect().
			Model((*models.Contribution)(nil)).
			Where("tx_signature = ?", op.Signature).
			Where("tx_signature != ''").
			Count(ctx)
		if err != nil {
			return err
		}
		if n > 0 {
			return nil
		}
	}

	var group models.Group
	if err := h.DB.NewSelect().Model(&group).Where("id = ?", op.GroupID).Scan(ctx); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return errors.New("group not found")
		}
		return err
	}

	var member models.Member
	err := h.DB.NewSelect().Model(&member).Where("group_id = ?", op.GroupID).
		Where("lower(wallet_address) = lower(?)", op.WalletAddress).
		Scan(ctx)
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		return err
	}
	if errors.Is(err, sql.ErrNoRows) {
		memberID := strings.TrimSpace(op.MemberID)
		if memberID == "" {
			memberID = strings.TrimSpace(op.WalletAddress)
		}
		member = models.Member{
			ID:            memberID,
			GroupID:       op.GroupID,
			WalletAddress: op.WalletAddress,
			JoinedAt:      time.Now().UTC(),
		}
		if _, err := h.DB.NewInsert().Model(&member).Exec(ctx); err != nil {
			return err
		}
	}

	contribution := &models.Contribution{
		GroupID:     op.GroupID,
		MemberID:    member.ID,
		Amount:      op.Amount,
		CycleNumber: op.CycleNumber,
		TxSignature: op.Signature,
		PaidAt:      time.Now().UTC(),
	}
	if _, err := h.DB.NewInsert().Model(contribution).Exec(ctx); err != nil {
		return err
	}

	creditDelta, creditReason := CreditDeltaForContribution(contribution.PaidAt, group.CycleDeadline, nil)

	member.TotalContributed += op.Amount
	member.CreditScore = applyCreditDelta(member.CreditScore, creditDelta)
	if _, err := h.DB.NewUpdate().
		Model(&member).
		Column("total_contributed", "credit_score").
		WherePK().
		Exec(ctx); err != nil {
		return err
	}

	group.VaultBalance += op.Amount
	if op.CycleNumber > group.CycleCount {
		group.CycleCount = op.CycleNumber
	}
	group.UpdatedAt = time.Now().UTC()
	if _, err := h.DB.NewUpdate().
		Model(&group).
		Column("vault_balance", "cycle_count", "updated_at").
		WherePK().
		Exec(ctx); err != nil {
		return err
	}

	h.publishContributionWS(op.GroupID, map[string]any{
		"group_id":        op.GroupID,
		"member_id":       member.ID,
		"amount":          op.Amount,
		"vault_balance":   group.VaultBalance,
		"credit_delta":    creditDelta,
		"credit_reason":   creditReason,
		"credit_score":    member.CreditScore,
		"source":          "helius_webhook",
		"tx_signature":    op.Signature,
	})
	return nil
}

func (h *Handler) applyWebhookYield(ctx context.Context, op webhookYieldOp) error {
	if op.Signature != "" {
		n, err := h.DB.NewSelect().
			Model((*models.YieldEvent)(nil)).
			Where("tx_signature = ?", op.Signature).
			Where("tx_signature != ''").
			Count(ctx)
		if err != nil {
			return err
		}
		if n > 0 {
			return nil
		}
	}

	event := &models.YieldEvent{
		GroupID:         op.GroupID,
		AmountDeposited: op.AmountDeposited,
		Protocol:        op.Protocol,
		APY:             op.APY,
		TxSignature:     op.Signature,
		CreatedAt:       time.Now().UTC(),
	}
	if _, err := h.DB.NewInsert().Model(event).Exec(ctx); err != nil {
		return err
	}

	h.publishYieldDeposit(op.GroupID, map[string]any{
		"group_id":         op.GroupID,
		"amount_deposited": event.AmountDeposited,
		"protocol":         event.Protocol,
		"apy":              event.APY,
		"source":           "helius_webhook",
		"tx_signature":     op.Signature,
	})
	return nil
}

type webhookContributionOp struct {
	GroupID         string
	MemberID        string
	WalletAddress   string
	Amount          int64
	CycleNumber     int
	Signature       string
}

type webhookYieldOp struct {
	GroupID         string
	AmountDeposited int64
	Protocol        string
	APY             float64
	Signature       string
}
