package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/dev3pack/ruby/backend/internal/auth"
	"github.com/dev3pack/ruby/backend/internal/config"
	"github.com/dev3pack/ruby/backend/internal/db"
	"github.com/dev3pack/ruby/backend/internal/handlers"
	appMiddleware "github.com/dev3pack/ruby/backend/internal/middleware"
	"github.com/go-chi/chi/v5"
	chiMiddleware "github.com/go-chi/chi/v5/middleware"
)

func main() {
	cfg := config.Load()
	database := db.New(cfg.DatabaseURL)
	h := handlers.NewHandler(database, cfg)

	r := chi.NewRouter()

	r.Use(chiMiddleware.Recoverer)
	r.Use(appMiddleware.CORS())
	r.Use(appMiddleware.Logger)

	r.Get("/health", h.Health)
	r.Route("/api/v1", func(r chi.Router) {
		r.Route("/auth", func(r chi.Router) {
			r.Post("/phantom/nonce", h.BeginPhantomAuth)
			r.Post("/phantom/verify", h.VerifyPhantomAuth)
			r.Post("/privy/verify", h.VerifyPrivyAuth)

			r.Group(func(r chi.Router) {
				r.Use(auth.Middleware(h.Auth))
				r.Get("/me", h.AuthMe)
				r.Post("/logout", h.Logout)
			})
		})

		r.Get("/groups", h.GetGroups)
		r.Post("/groups", h.CreateGroup)
		r.Post("/groups/{groupID}/invite-links", h.CreateGroupInviteLink)
		r.Post("/groups/{groupID}/join", h.JoinGroup)
		r.Post("/groups/{groupID}/contribute", h.Contribute)
		r.Post("/groups/{groupID}/swig", h.ConfigureSwig)
		r.Post("/groups/{groupID}/token", h.ConfigureToken2022)
		r.Get("/groups/{groupID}/explorer", h.GetGroupExplorerLinks)
		r.Get("/groups/{groupID}/yield", h.GetGroupYield)
		r.Post("/groups/{groupID}/yield", h.CreateYieldEvent)
		r.Post("/agent/run", h.RunTreasuryAgent)
		r.Get("/web3/balance", h.SolanaWalletBalance)
		r.Post("/webhooks/helius", h.HeliusWebhook)
	})

	addr := fmt.Sprintf(":%s", cfg.Port)
	log.Printf("Server starting on %s in %s mode", addr, cfg.AppEnv)
	if err := http.ListenAndServe(addr, r); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
