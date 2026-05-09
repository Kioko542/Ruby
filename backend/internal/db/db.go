package db

import (
	"context"
	"database/sql"
	"fmt"
	"strings"

	"github.com/dev3pack/ruby/backend/internal/models"
	"github.com/uptrace/bun"
	"github.com/uptrace/bun/dialect/pgdialect"
	"github.com/uptrace/bun/driver/pgdriver"
)

// Open connects to Postgres, ensures schema, and returns a bun DB (or an error).
func Open(dsn string) (*bun.DB, error) {
	if strings.TrimSpace(dsn) == "" {
		return nil, fmt.Errorf("database dsn is empty")
	}
	sqldb := sql.OpenDB(pgdriver.NewConnector(pgdriver.WithDSN(dsn)))
	if err := sqldb.Ping(); err != nil {
		return nil, err
	}
	database := bun.NewDB(sqldb, pgdialect.New())
	if err := EnsureSchema(database); err != nil {
		_ = database.Close()
		return nil, err
	}
	return database, nil
}

// New connects and panics on failure (process bootstrap).
func New(dsn string) *bun.DB {
	database, err := Open(dsn)
	if err != nil {
		panic(err)
	}
	return database
}

// EnsureSchema creates missing tables and applies additive DDL (idempotent). Safe on every deploy.
func EnsureSchema(database *bun.DB) error {
	ctx := context.Background()
	for _, model := range []any{
		(*models.Group)(nil),
		(*models.Member)(nil),
		(*models.Contribution)(nil),
		(*models.YieldEvent)(nil),
		(*models.ChainEvent)(nil),
		(*models.AuthSession)(nil),
		(*models.ReferralAttribution)(nil),
		(*models.SwigProposal)(nil),
		(*models.SwigProposalApproval)(nil),
		(*models.LoanRequest)(nil),
		(*models.LoanVote)(nil),
		(*models.BlinkAction)(nil),
		(*models.CycleSettlement)(nil),
	} {
		if _, err := database.NewCreateTable().
			Model(model).
			IfNotExists().
			Exec(ctx); err != nil {
			return fmt.Errorf("create table: %w", err)
		}
	}
	return migrateGroupsCycleColumns(ctx, database)
}

func migrateGroupsCycleColumns(ctx context.Context, database *bun.DB) error {
	stmts := []string{
		`ALTER TABLE groups ADD COLUMN IF NOT EXISTS active_cycle INTEGER NOT NULL DEFAULT 1`,
		`ALTER TABLE groups ADD COLUMN IF NOT EXISTS cycle_deadline TIMESTAMPTZ`,
		`ALTER TABLE groups ADD COLUMN IF NOT EXISTS payout_ready BOOLEAN NOT NULL DEFAULT FALSE`,
		`ALTER TABLE groups ADD COLUMN IF NOT EXISTS last_settled_cycle INTEGER NOT NULL DEFAULT 0`,
	}
	for _, q := range stmts {
		if _, err := database.ExecContext(ctx, q); err != nil {
			return fmt.Errorf("migrate groups columns: %w", err)
		}
	}
	return nil
}
