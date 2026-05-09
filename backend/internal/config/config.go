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
	AuthJWTSecret      string
	AuthSessionTTLMin  int64
	PrivyAppID         string
	PrivyIssuer        string
	PrivyJWKSURL       string
	AuthDomain         string
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
		AuthJWTSecret:      envOrDefault("AUTH_JWT_SECRET", "dev-change-me"),
		AuthSessionTTLMin:  envInt64("AUTH_SESSION_TTL_MINUTES", 60*24*7),
		PrivyAppID:         os.Getenv("PRIVY_APP_ID"),
		PrivyIssuer:        envOrDefault("PRIVY_ISSUER", "https://auth.privy.io"),
		PrivyJWKSURL:       os.Getenv("PRIVY_JWKS_URL"),
		AuthDomain:         envOrDefault("AUTH_DOMAIN", "localhost:3000"),
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
