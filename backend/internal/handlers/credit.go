package handlers

import (
	"net/http"
	"strings"
	"time"

	"github.com/dev3pack/ruby/backend/internal/models"
	"github.com/go-chi/chi/v5"
)

// Demo credit rules: +10 on-time (within cycle deadline), −5 late.
const (
	creditOnTime = 10
	creditLate   = -5
)

// CreditDeltaForContribution returns score change for a payment at paidAt against the group's cycle deadline.
// When deadline is nil, clientSaysOnTime controls scoring (nil → treat as on-time for backwards compatibility).
func CreditDeltaForContribution(paidAt time.Time, deadline *time.Time, clientSaysOnTime *bool) (delta int, reason string) {
	if deadline != nil {
		if paidAt.After(*deadline) {
			return creditLate, "late_after_deadline"
		}
		return creditOnTime, "on_time_before_deadline"
	}
	if clientSaysOnTime == nil {
		return creditOnTime, "on_time_no_deadline"
	}
	if *clientSaysOnTime {
		return creditOnTime, "on_time_client"
	}
	return creditLate, "late_client"
}

func applyCreditDelta(score int, delta int) int {
	score += delta
	if score < 0 {
		return 0
	}
	return score
}

// GetMemberCreditScore returns the stored credit score for a member in a group.
func (h *Handler) GetMemberCreditScore(w http.ResponseWriter, r *http.Request) {
	groupID := strings.TrimSpace(chi.URLParam(r, "groupID"))
	memberID := strings.TrimSpace(chi.URLParam(r, "memberID"))
	if groupID == "" || memberID == "" {
		writeError(w, http.StatusBadRequest, "groupID and memberID are required")
		return
	}

	ctx := r.Context()
	var group models.Group
	if err := h.DB.NewSelect().Model(&group).Where("id = ?", groupID).Scan(ctx); err != nil {
		writeError(w, http.StatusNotFound, "group not found")
		return
	}

	var member models.Member
	if err := h.DB.NewSelect().Model(&member).
		Where("id = ?", memberID).
		Where("group_id = ?", groupID).
		Scan(ctx); err != nil {
		writeError(w, http.StatusNotFound, "member not found in group")
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"group_id":       groupID,
		"member_id":      member.ID,
		"wallet_address": member.WalletAddress,
		"credit_score":   member.CreditScore,
		"cycle_deadline": group.CycleDeadline,
		"active_cycle":   group.ActiveCycle,
	})
}
