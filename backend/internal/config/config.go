package config

import (
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	Port               string
	DatabaseURL        string
	AppEnv             string
	SolanaRPCURL       string
	HeliusAPIKey       string
	SendAIAPIKey       string
	MinReserveLamports int64
	DeployPercent      int64
	KaminoAPYBps       int64
	JitoAPYBps         int64
}

func Load() *Config {
	_ = godotenv.Load() // Ignore error if .env doesn't exist

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	return &Config{
		Port:               port,
		DatabaseURL:        os.Getenv("DATABASE_URL"),
		AppEnv:             envOrDefault("APP_ENV", "development"),
		SolanaRPCURL:       envOrDefault("SOLANA_RPC_URL", "https://api.devnet.solana.com"),
		HeliusAPIKey:       os.Getenv("HELIUS_API_KEY"),
		SendAIAPIKey:       os.Getenv("SENDAI_API_KEY"),
		MinReserveLamports: envInt64("MIN_RESERVE_LAMPORTS", 100_000_000),
		DeployPercent:      envInt64("DEPLOY_PERCENT", 90),
		KaminoAPYBps:       envInt64("KAMINO_APY_BPS", 750),
		JitoAPYBps:         envInt64("JITO_APY_BPS", 620),
	}
}

func envOrDefault(key, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}

func envInt64(key string, fallback int64) int64 {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}

	n, err := strconv.ParseInt(value, 10, 64)
	if err != nil {
		return fallback
	}
	return n
}
