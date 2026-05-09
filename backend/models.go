package models

import (
	"time"

	"github.com/uptrace/bun"
)

// Group mirrors the on-chain GroupTable + off-chain metadata
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
	OnChainPDA      string    `bun:"on_chain_pda" json:"on_chain_pda"`
	CreatedAt       time.Time `bun:"created_at,default:current_timestamp" json:"created_at"`
	UpdatedAt       time.Time `bun:"updated_at,default:current_timestamp" json:"updated_at"`

	Members []*Member `bun:"rel:has-many,join:id=group_id" json:"members,omitempty"`
}

// Member mirrors the on-chain MemberRecord
type Member struct {
	bun.BaseModel `bun:"table:members,alias:m"`

	ID              string    `bun:"id,pk" json:"id"`
	GroupID         string    `bun:"group_id,notnull" json:"group_id"`
	WalletAddress   string    `bun:"wallet_address,notnull" json:"wallet_address"`
	TotalContributed int64   `bun:"total_contributed,default:0" json:"total_contributed"`
	CreditScore     int       `bun:"credit_score,default:0" json:"credit_score"` // increments on-time contributions
	JoinedAt        time.Time `bun:"joined_at,default:current_timestamp" json:"joined_at"`
}

// YieldEvent is written by the AI TreasuryAgent after each DeFi deposit
type YieldEvent struct {
	bun.BaseModel `bun:"table:yield_events,alias:ye"`

	ID            int64     `bun:"id,pk,autoincrement" json:"id"`
	GroupID       string    `bun:"group_id,notnull" json:"group_id"`
	AmountDeposited int64   `bun:"amount_deposited,notnull" json:"amount_deposited"`
	Protocol      string    `bun:"protocol,notnull" json:"protocol"` // "kamino" | "jito"
	APY           float64   `bun:"apy,notnull" json:"apy"`
	TxSignature   string    `bun:"tx_signature" json:"tx_signature"`
	CreatedAt     time.Time `bun:"created_at,default:current_timestamp" json:"created_at"`
}

// Contribution tracks each member's payment per cycle
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
