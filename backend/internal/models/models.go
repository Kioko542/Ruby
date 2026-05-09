package models

import (
	"time"

	"github.com/uptrace/bun"
)

// Group mirrors the on-chain GroupTable + off-chain metadata.
type Group struct {
	bun.BaseModel `bun:"table:groups,alias:g"`

	ID              string    `bun:"id,pk" json:"id"`
	Name            string    `bun:"name,notnull" json:"name"`
	CreatorWallet   string    `bun:"creator_wallet,notnull" json:"creator_wallet"`
	ContributionAmt int64     `bun:"contribution_amt,notnull" json:"contribution_amt"` // in lamports
	CycleCount      int       `bun:"cycle_count,default:0" json:"cycle_count"`
	MaxMembers      int       `bun:"max_members,default:10" json:"max_members"`
	VaultBalance    int64     `bun:"vault_balance,default:0" json:"vault_balance"`
	SwigVaultAddr   string    `bun:"swig_vault_addr" json:"swig_vault_addr"`
	SwigQuorum      int       `bun:"swig_quorum,default:0" json:"swig_quorum"`
	GroupTokenMint  string    `bun:"group_token_mint" json:"group_token_mint"`
	TransferHookPID string    `bun:"transfer_hook_pid" json:"transfer_hook_pid"`
	OnChainPDA      string    `bun:"on_chain_pda" json:"on_chain_pda"`
	CreatedAt       time.Time `bun:"created_at,default:current_timestamp" json:"created_at"`
	UpdatedAt       time.Time `bun:"updated_at,default:current_timestamp" json:"updated_at"`

	Members []*Member `bun:"rel:has-many,join:id=group_id" json:"members,omitempty"`
}

// ChainEvent stores webhook payload metadata from Helius.
type ChainEvent struct {
	bun.BaseModel `bun:"table:chain_events,alias:ce"`

	ID         int64     `bun:"id,pk,autoincrement" json:"id"`
	GroupID    string    `bun:"group_id" json:"group_id"`
	EventType  string    `bun:"event_type,notnull" json:"event_type"`
	Signature  string    `bun:"signature" json:"signature"`
	RawPayload string    `bun:"raw_payload,type:text,notnull" json:"raw_payload"`
	CreatedAt  time.Time `bun:"created_at,default:current_timestamp" json:"created_at"`
}

// AuthSession stores issued backend sessions for revocation and auditing.
type AuthSession struct {
	bun.BaseModel `bun:"table:auth_sessions,alias:as"`

	ID            string     `bun:"id,pk" json:"id"`
	UserID        string     `bun:"user_id,notnull" json:"user_id"`
	WalletAddress string     `bun:"wallet_address" json:"wallet_address"`
	Provider      string     `bun:"provider,notnull" json:"provider"` // privy | phantom
	CreatedAt     time.Time  `bun:"created_at,default:current_timestamp" json:"created_at"`
	ExpiresAt     time.Time  `bun:"expires_at,notnull" json:"expires_at"`
	RevokedAt     *time.Time `bun:"revoked_at" json:"revoked_at,omitempty"`
}

// Member mirrors the on-chain MemberRecord.
type Member struct {
	bun.BaseModel `bun:"table:members,alias:m"`

	ID               string    `bun:"id,pk" json:"id"`
	GroupID          string    `bun:"group_id,notnull" json:"group_id"`
	WalletAddress    string    `bun:"wallet_address,notnull" json:"wallet_address"`
	TotalContributed int64     `bun:"total_contributed,default:0" json:"total_contributed"`
	CreditScore      int       `bun:"credit_score,default:0" json:"credit_score"` // increments on-time contributions
	JoinedAt         time.Time `bun:"joined_at,default:current_timestamp" json:"joined_at"`
}

// ReferralAttribution records one-time referral credit for a valid new join.
type ReferralAttribution struct {
	bun.BaseModel `bun:"table:referral_attributions,alias:ra"`

	ID               int64     `bun:"id,pk,autoincrement" json:"id"`
	GroupID          string    `bun:"group_id,notnull" json:"group_id"`
	InvitedMemberID  string    `bun:"invited_member_id,notnull" json:"invited_member_id"`
	InvitedWallet    string    `bun:"invited_wallet,notnull" json:"invited_wallet"`
	ReferrerMemberID string    `bun:"referrer_member_id,notnull" json:"referrer_member_id"`
	ReferrerWallet   string    `bun:"referrer_wallet,notnull" json:"referrer_wallet"`
	Source           string    `bun:"source,notnull" json:"source"` // invite_link | direct_referrer
	CreatedAt        time.Time `bun:"created_at,default:current_timestamp" json:"created_at"`
}

// SwigProposal tracks treasury actions requiring multisig approvals.
type SwigProposal struct {
	bun.BaseModel `bun:"table:swig_proposals,alias:sp"`

	ID                string     `bun:"id,pk" json:"id"`
	GroupID           string     `bun:"group_id,notnull" json:"group_id"`
	Title             string     `bun:"title,notnull" json:"title"`
	Kind              string     `bun:"kind,notnull" json:"kind"` // emergency_loan | treasury_withdrawal
	AmountLamports    int64      `bun:"amount_lamports,notnull" json:"amount_lamports"`
	ApprovalsRequired int        `bun:"approvals_required,notnull" json:"approvals_required"`
	ApprovalsCount    int        `bun:"approvals_count,default:0" json:"approvals_count"`
	Status            string     `bun:"status,notnull" json:"status"` // pending | approved | executed
	CreatedByMemberID string     `bun:"created_by_member_id,notnull" json:"created_by_member_id"`
	CreatedAt         time.Time  `bun:"created_at,default:current_timestamp" json:"created_at"`
	ExecutedAt        *time.Time `bun:"executed_at" json:"executed_at,omitempty"`
}

type SwigProposalApproval struct {
	bun.BaseModel `bun:"table:swig_proposal_approvals,alias:spa"`

	ID         int64     `bun:"id,pk,autoincrement" json:"id"`
	ProposalID string    `bun:"proposal_id,notnull" json:"proposal_id"`
	MemberID   string    `bun:"member_id,notnull" json:"member_id"`
	Wallet     string    `bun:"wallet,notnull" json:"wallet"`
	ApprovedAt time.Time `bun:"approved_at,default:current_timestamp" json:"approved_at"`
}

// LoanRequest keeps a lightweight voting-only loan flow for hackathon scope.
type LoanRequest struct {
	bun.BaseModel `bun:"table:loan_requests,alias:lr"`

	ID               string    `bun:"id,pk" json:"id"`
	GroupID          string    `bun:"group_id,notnull" json:"group_id"`
	BorrowerMemberID string    `bun:"borrower_member_id,notnull" json:"borrower_member_id"`
	AmountLamports   int64     `bun:"amount_lamports,notnull" json:"amount_lamports"`
	Reason           string    `bun:"reason" json:"reason"`
	Status           string    `bun:"status,notnull" json:"status"` // pending | approved | rejected
	CreatedAt        time.Time `bun:"created_at,default:current_timestamp" json:"created_at"`
}

type LoanVote struct {
	bun.BaseModel `bun:"table:loan_votes,alias:lv"`

	ID       int64     `bun:"id,pk,autoincrement" json:"id"`
	LoanID   string    `bun:"loan_id,notnull" json:"loan_id"`
	MemberID string    `bun:"member_id,notnull" json:"member_id"`
	Vote     string    `bun:"vote,notnull" json:"vote"` // approve | reject
	VotedAt  time.Time `bun:"voted_at,default:current_timestamp" json:"voted_at"`
}

// BlinkAction tracks generated and executed blink actions.
type BlinkAction struct {
	bun.BaseModel `bun:"table:blink_actions,alias:ba"`

	ID        string    `bun:"id,pk" json:"id"`
	BlinkType string    `bun:"blink_type,notnull" json:"blink_type"` // contribute | vote | withdraw
	GroupID   string    `bun:"group_id,notnull" json:"group_id"`
	MemberID  string    `bun:"member_id" json:"member_id"`
	Payload   string    `bun:"payload,type:text,notnull" json:"payload"`
	Status    string    `bun:"status,notnull" json:"status"` // created | executed | failed
	CreatedAt time.Time `bun:"created_at,default:current_timestamp" json:"created_at"`
	UpdatedAt time.Time `bun:"updated_at,default:current_timestamp" json:"updated_at"`
}

// YieldEvent is written by the AI Treasury Agent after each DeFi deposit.
type YieldEvent struct {
	bun.BaseModel `bun:"table:yield_events,alias:ye"`

	ID              int64     `bun:"id,pk,autoincrement" json:"id"`
	GroupID         string    `bun:"group_id,notnull" json:"group_id"`
	AmountDeposited int64     `bun:"amount_deposited,notnull" json:"amount_deposited"`
	Protocol        string    `bun:"protocol,notnull" json:"protocol"` // "kamino" | "jito"
	APY             float64   `bun:"apy,notnull" json:"apy"`
	TxSignature     string    `bun:"tx_signature" json:"tx_signature"`
	CreatedAt       time.Time `bun:"created_at,default:current_timestamp" json:"created_at"`
}

// Contribution tracks each member's payment per cycle.
type Contribution struct {
	bun.BaseModel `bun:"table:contributions,alias:c"`

	ID          int64     `bun:"id,pk,autoincrement" json:"id"`
	GroupID     string    `bun:"group_id,notnull" json:"group_id"`
	MemberID    string    `bun:"member_id,notnull" json:"member_id"`
	Amount      int64     `bun:"amount,notnull" json:"amount"`
	CycleNumber int       `bun:"cycle_number,notnull" json:"cycle_number"`
	TxSignature string    `bun:"tx_signature" json:"tx_signature"`
	PaidAt      time.Time `bun:"paid_at,default:current_timestamp" json:"paid_at"`
}
