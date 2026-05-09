package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/dev3pack/ruby/backend/internal/models"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

var wsUpgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

func (h *Handler) EventsWebSocket(w http.ResponseWriter, r *http.Request) {
	if h.Hub == nil {
		writeError(w, http.StatusServiceUnavailable, "event stream not available")
		return
	}
	conn, err := wsUpgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}
	defer conn.Close()

	ch, cancel := h.Hub.Subscribe()
	defer cancel()

	done := make(chan struct{})
	go func() {
		defer close(done)
		for {
			if _, _, err := conn.ReadMessage(); err != nil {
				return
			}
		}
	}()

	ping := time.NewTicker(30 * time.Second)
	defer ping.Stop()

	for {
		select {
		case <-done:
			return
		case raw, ok := <-ch:
			if !ok {
				return
			}
			if err := conn.WriteMessage(websocket.TextMessage, raw); err != nil {
				return
			}
		case <-ping.C:
			if err := conn.WriteMessage(websocket.PingMessage, []byte("ping")); err != nil {
				return
			}
		}
	}
}

type createSwigProposalRequest struct {
	Title             string `json:"title"`
	Kind              string `json:"kind"`
	AmountLamports    int64  `json:"amount_lamports"`
	ApprovalsRequired int    `json:"approvals_required"`
	CreatedByMemberID string `json:"created_by_member_id"`
}

func (h *Handler) CreateSwigProposal(w http.ResponseWriter, r *http.Request) {
	groupID := chi.URLParam(r, "groupID")
	var req createSwigProposalRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}
	if strings.TrimSpace(groupID) == "" || strings.TrimSpace(req.Title) == "" || req.AmountLamports <= 0 || strings.TrimSpace(req.CreatedByMemberID) == "" {
		writeError(w, http.StatusBadRequest, "groupID, title, amount_lamports and created_by_member_id are required")
		return
	}
	if req.ApprovalsRequired <= 0 {
		req.ApprovalsRequired = 3
	}
	if strings.TrimSpace(req.Kind) == "" {
		req.Kind = "emergency_loan"
	}

	proposal := &models.SwigProposal{
		ID:                "sp_" + uuid.NewString(),
		GroupID:           groupID,
		Title:             req.Title,
		Kind:              req.Kind,
		AmountLamports:    req.AmountLamports,
		ApprovalsRequired: req.ApprovalsRequired,
		ApprovalsCount:    0,
		Status:            "pending",
		CreatedByMemberID: req.CreatedByMemberID,
		CreatedAt:         time.Now().UTC(),
	}
	if _, err := h.DB.NewInsert().Model(proposal).Exec(context.Background()); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to create swig proposal")
		return
	}

	writeJSON(w, http.StatusCreated, proposal)
	h.publish("swig.proposal.created", map[string]any{"group_id": groupID, "proposal_id": proposal.ID, "kind": proposal.Kind})
}

type approveSwigProposalRequest struct {
	MemberID string `json:"member_id"`
	Wallet   string `json:"wallet"`
}

func (h *Handler) ApproveSwigProposal(w http.ResponseWriter, r *http.Request) {
	groupID := chi.URLParam(r, "groupID")
	proposalID := chi.URLParam(r, "proposalID")
	var req approveSwigProposalRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}
	if strings.TrimSpace(req.MemberID) == "" || strings.TrimSpace(req.Wallet) == "" {
		writeError(w, http.StatusBadRequest, "member_id and wallet are required")
		return
	}

	ctx := context.Background()
	var proposal models.SwigProposal
	if err := h.DB.NewSelect().Model(&proposal).Where("id = ?", proposalID).Where("group_id = ?", groupID).Scan(ctx); err != nil {
		writeError(w, http.StatusNotFound, "proposal not found")
		return
	}
	if proposal.Status != "pending" {
		writeError(w, http.StatusConflict, "proposal is not pending")
		return
	}

	existing, err := h.DB.NewSelect().Model((*models.SwigProposalApproval)(nil)).
		Where("proposal_id = ?", proposalID).Where("member_id = ?", req.MemberID).Count(ctx)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to check approvals")
		return
	}
	if existing > 0 {
		writeError(w, http.StatusConflict, "member already approved this proposal")
		return
	}

	approval := &models.SwigProposalApproval{
		ProposalID: proposalID,
		MemberID:   req.MemberID,
		Wallet:     req.Wallet,
		ApprovedAt: time.Now().UTC(),
	}
	if _, err := h.DB.NewInsert().Model(approval).Exec(ctx); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to save approval")
		return
	}

	proposal.ApprovalsCount++
	if proposal.ApprovalsCount >= proposal.ApprovalsRequired {
		proposal.Status = "approved"
		now := time.Now().UTC()
		proposal.ExecutedAt = &now
	}
	if _, err := h.DB.NewUpdate().Model(&proposal).
		Column("approvals_count", "status", "executed_at").
		WherePK().
		Exec(ctx); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to update proposal")
		return
	}

	writeJSON(w, http.StatusOK, proposal)
	h.publish("swig.proposal.approved", map[string]any{"group_id": groupID, "proposal_id": proposalID, "approvals_count": proposal.ApprovalsCount, "status": proposal.Status})
}

func (h *Handler) ListSwigProposals(w http.ResponseWriter, r *http.Request) {
	groupID := chi.URLParam(r, "groupID")
	var proposals []models.SwigProposal
	if err := h.DB.NewSelect().Model(&proposals).Where("group_id = ?", groupID).Order("created_at DESC").Scan(context.Background()); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to load proposals")
		return
	}
	writeJSON(w, http.StatusOK, proposals)
}

type createLoanRequest struct {
	ID               string `json:"id,omitempty"`
	BorrowerMemberID string `json:"borrower_member_id"`
	AmountLamports   int64  `json:"amount_lamports"`
	Reason           string `json:"reason"`
}

func (h *Handler) CreateLoanRequest(w http.ResponseWriter, r *http.Request) {
	groupID := chi.URLParam(r, "groupID")
	var req createLoanRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}
	if strings.TrimSpace(req.BorrowerMemberID) == "" || req.AmountLamports <= 0 {
		writeError(w, http.StatusBadRequest, "borrower_member_id and positive amount_lamports are required")
		return
	}
	loanID := strings.TrimSpace(req.ID)
	if loanID == "" {
		loanID = "loan_" + uuid.NewString()
	}
	loan := &models.LoanRequest{
		ID:               loanID,
		GroupID:          groupID,
		BorrowerMemberID: req.BorrowerMemberID,
		AmountLamports:   req.AmountLamports,
		Reason:           req.Reason,
		Status:           "pending",
		CreatedAt:        time.Now().UTC(),
	}
	if _, err := h.DB.NewInsert().Model(loan).Exec(context.Background()); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to create loan request")
		return
	}
	writeJSON(w, http.StatusCreated, loan)
	h.publish("loan.request.created", map[string]any{"group_id": groupID, "loan_id": loan.ID, "amount_lamports": loan.AmountLamports})
}

type voteLoanRequest struct {
	MemberID string `json:"member_id"`
	Vote     string `json:"vote"`
}

func (h *Handler) VoteLoanRequest(w http.ResponseWriter, r *http.Request) {
	groupID := chi.URLParam(r, "groupID")
	loanID := chi.URLParam(r, "loanID")
	var req voteLoanRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}
	req.Vote = strings.ToLower(strings.TrimSpace(req.Vote))
	if strings.TrimSpace(req.MemberID) == "" || (req.Vote != "approve" && req.Vote != "reject") {
		writeError(w, http.StatusBadRequest, "member_id and vote(approve|reject) are required")
		return
	}
	ctx := context.Background()
	var loan models.LoanRequest
	if err := h.DB.NewSelect().Model(&loan).Where("id = ?", loanID).Where("group_id = ?", groupID).Scan(ctx); err != nil {
		writeError(w, http.StatusNotFound, "loan request not found")
		return
	}

	existing, err := h.DB.NewSelect().Model((*models.LoanVote)(nil)).
		Where("loan_id = ?", loanID).
		Where("member_id = ?", req.MemberID).
		Count(ctx)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to check existing vote")
		return
	}
	if existing > 0 {
		writeError(w, http.StatusConflict, "member already voted")
		return
	}

	vote := &models.LoanVote{
		LoanID:   loanID,
		MemberID: req.MemberID,
		Vote:     req.Vote,
		VotedAt:  time.Now().UTC(),
	}
	if _, err := h.DB.NewInsert().Model(vote).Exec(ctx); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to save vote")
		return
	}

	approvals, _ := h.DB.NewSelect().Model((*models.LoanVote)(nil)).Where("loan_id = ?", loanID).Where("vote = 'approve'").Count(ctx)
	rejects, _ := h.DB.NewSelect().Model((*models.LoanVote)(nil)).Where("loan_id = ?", loanID).Where("vote = 'reject'").Count(ctx)
	if approvals >= 3 {
		loan.Status = "approved"
	} else if rejects >= 3 {
		loan.Status = "rejected"
	}
	if loan.Status != "pending" {
		_, _ = h.DB.NewUpdate().Model(&loan).Column("status").WherePK().Exec(ctx)
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"loan_id":   loanID,
		"status":    loan.Status,
		"approvals": approvals,
		"rejects":   rejects,
	})
	h.publish("loan.request.voted", map[string]any{"group_id": groupID, "loan_id": loanID, "status": loan.Status, "approvals": approvals, "rejects": rejects})
}

func (h *Handler) ListLoanRequests(w http.ResponseWriter, r *http.Request) {
	groupID := chi.URLParam(r, "groupID")
	var loans []models.LoanRequest
	if err := h.DB.NewSelect().Model(&loans).Where("group_id = ?", groupID).Order("created_at DESC").Scan(context.Background()); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to load loans")
		return
	}
	writeJSON(w, http.StatusOK, loans)
}

type createBlinkRequest struct {
	GroupID  string         `json:"group_id"`
	MemberID string         `json:"member_id,omitempty"`
	Payload  map[string]any `json:"payload,omitempty"`
}

func (h *Handler) CreateBlink(w http.ResponseWriter, r *http.Request) {
	blinkType := strings.ToLower(strings.TrimSpace(chi.URLParam(r, "blinkType")))
	if blinkType != "contribute" && blinkType != "vote" && blinkType != "withdraw" {
		writeError(w, http.StatusBadRequest, "blinkType must be contribute, vote, or withdraw")
		return
	}
	var req createBlinkRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}
	if strings.TrimSpace(req.GroupID) == "" {
		writeError(w, http.StatusBadRequest, "group_id is required")
		return
	}
	actionID := "blink_" + uuid.NewString()
	rawPayload, _ := json.Marshal(req.Payload)
	action := &models.BlinkAction{
		ID:        actionID,
		BlinkType: blinkType,
		GroupID:   req.GroupID,
		MemberID:  req.MemberID,
		Payload:   string(rawPayload),
		Status:    "created",
		CreatedAt: time.Now().UTC(),
		UpdatedAt: time.Now().UTC(),
	}
	if _, err := h.DB.NewInsert().Model(action).Exec(context.Background()); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to create blink action")
		return
	}

	base := strings.TrimSuffix(strings.TrimSpace(h.Config.BlinkBaseURL), "/")
	if base == "" {
		base = "http://localhost:3000/blinks"
	}
	url := fmt.Sprintf("%s/%s/%s", base, blinkType, actionID)
	writeJSON(w, http.StatusCreated, map[string]any{
		"action_id":  actionID,
		"blink_type": blinkType,
		"url":        url,
		"status":     action.Status,
	})
	h.publish("blink.created", map[string]any{"action_id": actionID, "blink_type": blinkType, "group_id": req.GroupID})
}

func (h *Handler) ExecuteBlink(w http.ResponseWriter, r *http.Request) {
	blinkType := strings.ToLower(strings.TrimSpace(chi.URLParam(r, "blinkType")))
	actionID := chi.URLParam(r, "actionID")
	ctx := context.Background()
	var action models.BlinkAction
	if err := h.DB.NewSelect().Model(&action).Where("id = ?", actionID).Where("blink_type = ?", blinkType).Scan(ctx); err != nil {
		writeError(w, http.StatusNotFound, "blink action not found")
		return
	}
	action.Status = "executed"
	action.UpdatedAt = time.Now().UTC()
	if _, err := h.DB.NewUpdate().Model(&action).Column("status", "updated_at").WherePK().Exec(ctx); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to execute blink action")
		return
	}
	writeJSON(w, http.StatusOK, action)
	h.publish("blink.executed", map[string]any{"action_id": actionID, "blink_type": blinkType, "group_id": action.GroupID})
}

func (h *Handler) ListBlinkActions(w http.ResponseWriter, r *http.Request) {
	var actions []models.BlinkAction
	if err := h.DB.NewSelect().Model(&actions).Order("created_at DESC").Limit(100).Scan(context.Background()); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list blink actions")
		return
	}
	writeJSON(w, http.StatusOK, actions)
}

type tokenTransferValidationRequest struct {
	FromMemberID string `json:"from_member_id"`
	ToMemberID   string `json:"to_member_id"`
	Amount       int64  `json:"amount"`
}

// ValidateTokenTransfer simulates a transfer-hook governance check.
func (h *Handler) ValidateTokenTransfer(w http.ResponseWriter, r *http.Request) {
	groupID := chi.URLParam(r, "groupID")
	var req tokenTransferValidationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}
	if strings.TrimSpace(req.FromMemberID) == "" || strings.TrimSpace(req.ToMemberID) == "" || req.Amount <= 0 {
		writeError(w, http.StatusBadRequest, "from_member_id, to_member_id and positive amount are required")
		return
	}
	if req.FromMemberID == req.ToMemberID {
		writeError(w, http.StatusBadRequest, "self-transfer is not allowed")
		return
	}

	ctx := context.Background()
	fromExists, err := h.DB.NewSelect().Model((*models.Member)(nil)).
		Where("group_id = ?", groupID).
		Where("id = ?", req.FromMemberID).
		Count(ctx)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to validate sender")
		return
	}
	toExists, err := h.DB.NewSelect().Model((*models.Member)(nil)).
		Where("group_id = ?", groupID).
		Where("id = ?", req.ToMemberID).
		Count(ctx)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to validate receiver")
		return
	}
	allowed := fromExists > 0 && toExists > 0
	reason := "ok"
	if !allowed {
		reason = "both sender and receiver must be members of the group"
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"group_id": groupID,
		"allowed":  allowed,
		"reason":   reason,
	})
}

func (h *Handler) YieldRates(w http.ResponseWriter, r *http.Request) {
	kamino := float64(h.Config.KaminoAPYBps) / 100
	jito := float64(h.Config.JitoAPYBps) / 100
	best := "kamino"
	if jito > kamino {
		best = "jito"
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"kamino_apy": kamino,
		"jito_apy":   jito,
		"best":       best,
	})
}
