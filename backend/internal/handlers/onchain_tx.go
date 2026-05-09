package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
)

func (h *Handler) OnchainConfig(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{
		"ruby_program_id":       h.Config.RubyProgramID,
		"swig_program_id":       h.Config.SwigProgramID,
		"token_2022_program_id": h.Config.Token2022ProgramID,
		"anchor_idl_path":       h.Config.AnchorIDLPath,
		"idl_available":         h.Anchor != nil && h.Anchor.IDLAvailable(),
	})
}

type buildTxRequest struct {
	GroupID       string `json:"group_id,omitempty"`
	MemberID      string `json:"member_id,omitempty"`
	WalletAddress string `json:"wallet_address,omitempty"`
	Amount        int64  `json:"amount,omitempty"`
	LoanID        string `json:"loan_id,omitempty"`
	ProposalID    string `json:"proposal_id,omitempty"`
	BlinkType     string `json:"blink_type,omitempty"`
}

func (h *Handler) BuildTx(w http.ResponseWriter, r *http.Request) {
	if h.Anchor == nil {
		writeError(w, http.StatusServiceUnavailable, "anchor client not configured")
		return
	}
	action := strings.TrimSpace(chi.URLParam(r, "action"))
	var req buildTxRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}

	instruction := ""
	accounts := map[string]any{
		"group_id":       req.GroupID,
		"member_id":      req.MemberID,
		"wallet_address": req.WalletAddress,
	}
	args := map[string]any{}

	switch action {
	case "create-group":
		instruction = "create_group"
		args["contribution_lamports"] = req.Amount
	case "contribute":
		instruction = "contribute"
		args["amount"] = req.Amount
		args["on_time"] = true
	case "create-loan":
		instruction = "create_loan_request"
		args["amount_lamports"] = req.Amount
	case "vote-loan":
		instruction = "vote_loan_request"
		accounts["loan_id"] = req.LoanID
		args["approve"] = true
	case "create-swig-proposal":
		instruction = "create_swig_proposal"
		args["kind"] = 0
		args["amount_lamports"] = req.Amount
		args["approvals_required"] = 3
	case "approve-swig-proposal":
		instruction = "approve_swig_proposal"
		accounts["proposal_id"] = req.ProposalID
	case "create-blink":
		instruction = "create_blink_action"
		args["blink_type"] = req.BlinkType
	default:
		writeError(w, http.StatusBadRequest, "unsupported tx action")
		return
	}

	plan, err := h.Anchor.BuildTxPlan(instruction, accounts, args)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, plan)
}
