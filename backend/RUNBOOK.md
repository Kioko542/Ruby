# Ruby Backend — Runbook

## Stack
- **Language:** Go 1.22
- **Router:** Chi v5
- **ORM/Query:** Bun + pgdriver (Postgres)
- **Deploy:** Render (render.yaml in root)

## Local Setup

### Prerequisites
- Go 1.22+
- Docker (for local Postgres) or a Postgres instance

### 1. Clone & navigate
```bash
cd backend/
```

### 2. Install deps
```bash
go mod tidy
```

### 3. Set up env
```bash
cp .env.example .env
# Edit .env — set DATABASE_URL to your local Postgres
```

### 4. Start local services (Docker Compose)
```bash
cd ..
docker compose up -d
# or from backend/
make services-up
```

### 5. Run the server
```bash
make run
# or with live reload:
go install github.com/air-verse/air@latest
make dev
```

### 6. Verify
```bash
curl http://localhost:8080/health
# → {"service":"ruby-backend","status":"ok"}
```

### Stop local services
```bash
cd ..
docker compose down
# or from backend/
make services-down
```

---

## Env Var Registry (Single Source of Truth)

| Variable | Owner | Description |
|---|---|---|
| `PORT` | backend | HTTP port |
| `APP_ENV` | backend | `development` / `production` |
| `DATABASE_URL` | backend | Postgres DSN |
| `SOLANA_RPC_URL` | web3 | Solana RPC endpoint |
| `HELIUS_API_KEY` | web3 | Helius webhook key |
| `SENDAI_API_KEY` | backend | AI agent key (Phase 3) |
| `AUTH_JWT_SECRET` | backend | Signing secret for backend session JWT |
| `AUTH_SESSION_TTL_MINUTES` | backend | Session expiry in minutes |
| `AUTH_DOMAIN` | backend/frontend | Domain included in Phantom sign-in message |
| `PRIVY_APP_ID` | auth | Privy app identifier (JWT audience) |
| `PRIVY_ISSUER` | auth | Privy token issuer |
| `PRIVY_JWKS_URL` | auth | Privy JWKS endpoint for JWT signature verification |

> ⚠️ Do NOT add new env vars without updating this table and notifying dependent owners.

---

## Route Map

| Method | Path | Phase | Owner |
|---|---|---|---|
| GET | `/health` | 1 | backend |
| GET | `/api/v1/groups` | 2 | backend |
| GET | `/api/v1/groups/{id}/yield` | 3 | backend |
| POST | `/api/v1/auth/phantom/nonce` | 1 | auth |
| POST | `/api/v1/auth/phantom/verify` | 1 | auth |
| POST | `/api/v1/auth/privy/verify` | 1 | auth |
| GET | `/api/v1/auth/me` | 1 | auth |
| POST | `/api/v1/auth/logout` | 1 | auth |
| POST | `/api/v1/groups` | 2 | web3 DRI |
| POST | `/api/v1/groups/{id}/contribute` | 2 | web3 DRI |
| POST | `/api/v1/groups/{id}/yield` | 3 | agent writes |

---

## Database Models

| Table | Description |
|---|---|
| `groups` | Off-chain mirror of on-chain GroupTable |
| `members` | Off-chain mirror of on-chain MemberRecord |
| `contributions` | Per-cycle payment log |
| `yield_events` | AI agent DeFi deposit log (Phase 3) |

---

## Handoff Rules
- **backend DRI** owns all DB writes, schedulers, and business logic
- **web3** exposes wallet/transaction requirements via agreed interfaces only
- **frontend** consumes REST API only — no direct DB access
- Schema changes require versioning + notification to all owners
