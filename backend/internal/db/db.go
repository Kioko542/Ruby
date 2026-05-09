package db

import (
	"context"
	"database/sql"
	"fmt"
	"log"
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
	ensureSchema(database)
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

func ensureSchema(database *bun.DB) {
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
			log.Fatalf("failed to ensure schema: %v", err)
		}
	}
	migrateGroupsCycleColumns(ctx, database)
}

func migrateGroupsCycleColumns(ctx context.Context, database *bun.DB) {
	stmts := []string{
		`ALTER TABLE groups ADD COLUMN IF NOT EXISTS active_cycle INTEGER NOT NULL DEFAULT 1`,
		`ALTER TABLE groups ADD COLUMN IF NOT EXISTS cycle_deadline TIMESTAMPTZ`,
		`ALTER TABLE groups ADD COLUMN IF NOT EXISTS payout_ready BOOLEAN NOT NULL DEFAULT FALSE`,
		`ALTER TABLE groups ADD COLUMN IF NOT EXISTS last_settled_cycle INTEGER NOT NULL DEFAULT 0`,
	}
	for _, q := range stmts {
		if _, err := database.ExecContext(ctx, q); err != nil {
			log.Fatalf("failed to migrate groups cycle columns: %v", err)
		}
	}
}
