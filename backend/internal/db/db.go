package db

import (
	"context"
	"database/sql"
	"log"

	"github.com/dev3pack/ruby/backend/internal/models"
	"github.com/uptrace/bun"
	"github.com/uptrace/bun/dialect/pgdialect"
	"github.com/uptrace/bun/driver/pgdriver"
)

func New(dsn string) *bun.DB {
	sqldb := sql.OpenDB(pgdriver.NewConnector(pgdriver.WithDSN(dsn)))
	if err := sqldb.Ping(); err != nil {
		panic(err)
	}
	database := bun.NewDB(sqldb, pgdialect.New())
	ensureSchema(database)
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
	} {
		if _, err := database.NewCreateTable().
			Model(model).
			IfNotExists().
			Exec(ctx); err != nil {
			log.Fatalf("failed to ensure schema: %v", err)
		}
	}
}
