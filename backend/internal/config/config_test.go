package config

import "testing"

func TestLoadDefaults(t *testing.T) {
	t.Setenv("PORT", "")
	t.Setenv("DATABASE_URL", "")
	t.Setenv("APP_ENV", "")
	t.Setenv("SOLANA_RPC_URL", "")
	t.Setenv("HELIUS_API_KEY", "")
	t.Setenv("SENDAI_API_KEY", "")
	t.Setenv("MIN_RESERVE_LAMPORTS", "")
	t.Setenv("DEPLOY_PERCENT", "")
	t.Setenv("KAMINO_APY_BPS", "")
	t.Setenv("JITO_APY_BPS", "")

	cfg := Load()
	if cfg.Port != "8080" {
		t.Fatalf("expected default port 8080, got %s", cfg.Port)
	}
	if cfg.AppEnv != "development" {
		t.Fatalf("expected default app env development, got %s", cfg.AppEnv)
	}
	if cfg.SolanaRPCURL != "https://api.devnet.solana.com" {
		t.Fatalf("unexpected default rpc url: %s", cfg.SolanaRPCURL)
	}
	if cfg.MinReserveLamports != 100_000_000 {
		t.Fatalf("unexpected default min reserve: %d", cfg.MinReserveLamports)
	}
	if cfg.DeployPercent != 90 {
		t.Fatalf("unexpected default deploy percent: %d", cfg.DeployPercent)
	}
}

func TestLoadFromEnv(t *testing.T) {
	t.Setenv("PORT", "9090")
	t.Setenv("DATABASE_URL", "postgres://example")
	t.Setenv("APP_ENV", "test")
	t.Setenv("SOLANA_RPC_URL", "http://rpc.local")
	t.Setenv("HELIUS_API_KEY", "helius-key")
	t.Setenv("SENDAI_API_KEY", "sendai-key")
	t.Setenv("MIN_RESERVE_LAMPORTS", "500")
	t.Setenv("DEPLOY_PERCENT", "75")
	t.Setenv("KAMINO_APY_BPS", "111")
	t.Setenv("JITO_APY_BPS", "222")

	cfg := Load()
	if cfg.Port != "9090" || cfg.DatabaseURL != "postgres://example" || cfg.AppEnv != "test" {
		t.Fatalf("expected explicit env to be loaded, got %+v", cfg)
	}
	if cfg.SolanaRPCURL != "http://rpc.local" || cfg.HeliusAPIKey != "helius-key" || cfg.SendAIAPIKey != "sendai-key" {
		t.Fatalf("expected API env vars to be loaded, got %+v", cfg)
	}
	if cfg.MinReserveLamports != 500 || cfg.DeployPercent != 75 || cfg.KaminoAPYBps != 111 || cfg.JitoAPYBps != 222 {
		t.Fatalf("expected numeric env vars to be loaded, got %+v", cfg)
	}
}
