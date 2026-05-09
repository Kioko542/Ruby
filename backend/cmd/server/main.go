package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/dev3pack/ruby/backend/internal/auth"
	"github.com/dev3pack/ruby/backend/internal/config"
	"github.com/dev3pack/ruby/backend/internal/db"
	"github.com/dev3pack/ruby/backend/internal/handlers"
	appMiddleware "github.com/dev3pack/ruby/backend/internal/middleware"
	"github.com/dev3pack/ruby/backend/internal/treasury"
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
	r.Get("/api/v1/ws", h.EventsWebSocket)
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

		r.Get("/groups/{groupID}/swig/proposals", h.ListSwigProposals)
		r.Get("/groups", h.GetGroups)
		r.Get("/groups/{groupID}/explorer", h.GetGroupExplorerLinks)
		r.Get("/groups/{groupID}/loans", h.ListLoanRequests)
		r.Get("/groups/{groupID}/yield", h.GetGroupYield)
		r.Get("/agent/yield-rates", h.YieldRates)
		r.Get("/web3/balance", h.SolanaWalletBalance)
		r.Get("/onchain/config", h.OnchainConfig)
		r.Post("/webhooks/helius", h.HeliusWebhook)
		r.Get("/blinks/actions", h.ListBlinkActions)

		r.Group(func(r chi.Router) {
			r.Use(auth.Middleware(h.Auth))
			r.Post("/groups", h.CreateGroup)
			r.Post("/groups/{groupID}/invite-links", h.CreateGroupInviteLink)
			r.Post("/groups/{groupID}/join", h.JoinGroup)
			r.Post("/groups/{groupID}/contribute", h.Contribute)
			r.Post("/groups/{groupID}/swig", h.ConfigureSwig)
			r.Post("/groups/{groupID}/swig/proposals", h.CreateSwigProposal)
			r.Post("/groups/{groupID}/swig/proposals/{proposalID}/approve", h.ApproveSwigProposal)
			r.Post("/groups/{groupID}/token", h.ConfigureToken2022)
			r.Post("/groups/{groupID}/token/validate-transfer", h.ValidateTokenTransfer)
			r.Post("/groups/{groupID}/loans", h.CreateLoanRequest)
			r.Post("/groups/{groupID}/loans/{loanID}/vote", h.VoteLoanRequest)
			r.Post("/groups/{groupID}/yield", h.CreateYieldEvent)
			r.Post("/agent/run", h.RunTreasuryAgent)
			r.Post("/blinks/{blinkType}/create", h.CreateBlink)
			r.Post("/blinks/{blinkType}/{actionID}/execute", h.ExecuteBlink)
			r.Post("/tx/build/{action}", h.BuildTx)
		})
	})

	if cfg.AgentAutoRun {
		treasury.StartScheduler(context.Background(), time.Duration(cfg.AgentIntervalSec)*time.Second, h)
	}

	addr := fmt.Sprintf(":%s", cfg.Port)
	log.Printf("Server starting on %s in %s mode", addr, cfg.AppEnv)
	if err := http.ListenAndServe(addr, r); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
