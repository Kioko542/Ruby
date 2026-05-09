package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"

	"github.com/dev3pack/ruby/backend/internal/config"
	"github.com/dev3pack/ruby/backend/internal/db"
	"github.com/dev3pack/ruby/backend/internal/handlers"
	"github.com/dev3pack/ruby/backend/internal/middleware"
)

func main() {
	cfg := config.Load()

	database := db.New(cfg.DatabaseURL)
	defer database.Close()

	h := handlers.New(database)

	r := chi.NewRouter()

	// Global middleware
	r.Use(chimiddleware.RequestID)
	r.Use(chimiddleware.Recoverer)
	r.Use(middleware.Logger)
	r.Use(middleware.CORS())

	// Health check (no version prefix — used by Render health probe)
	r.Get("/health", h.Health)

	// API v1 routes
	r.Route("/api/v1", func(r chi.Router) {
		// Groups
		r.Get("/groups", h.ListGroups)
		r.Get("/groups/{groupID}/yield", h.GetGroupYield)

		// TODO Phase 2: POST /groups (create group — web3 DRI)
		// TODO Phase 2: POST /groups/{groupID}/contribute (web3 DRI)
		// TODO Phase 3: POST /groups/{groupID}/yield (agent writes here)
	})

	addr := fmt.Sprintf(":%s", cfg.Port)
	log.Printf("🚀 Ruby backend running on %s [env=%s]", addr, cfg.AppEnv)

	if err := http.ListenAndServe(addr, r); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
