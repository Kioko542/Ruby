package main

import (
	"fmt"
	"log"
	"net/http"

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
	h := handlers.NewHandler(database)

	r := chi.NewRouter()

	r.Use(chiMiddleware.Recoverer)
	r.Use(appMiddleware.CORS())
	r.Use(appMiddleware.Logger)

	r.Get("/health", h.Health)
	r.Route("/api/v1", func(r chi.Router) {
		r.Get("/groups", h.GetGroups)
		r.Get("/groups/{groupID}/yield", h.GetGroupYield)
	})

	addr := fmt.Sprintf(":%s", cfg.Port)
	log.Printf("Server starting on %s in %s mode", addr, cfg.AppEnv)
	if err := http.ListenAndServe(addr, r); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
