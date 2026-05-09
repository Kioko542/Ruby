# Trello Backend + Web3 Completion

This checklist maps Trello backend/web3 cards to implemented deliverables in this repository.

## Step 1 - Foundation backend API baseline

- [x] Health endpoint with service payload: `GET /health`
- [x] Bootstrapped Postgres schema creation on startup
- [x] Route wiring in both server entrypoints:
  - `cmd/server/main.go`
  - `main.go`

## Step 2 - Groups and contributions (Phase 2)

- [x] Create Group: `POST /api/v1/groups`
- [x] Join Group: `POST /api/v1/groups/{groupID}/join`
- [x] Contribute: `POST /api/v1/groups/{groupID}/contribute`
- [x] List Groups: `GET /api/v1/groups`
- [x] Group yield read: `GET /api/v1/groups/{groupID}/yield`

### Data model alignment

- [x] `groups` table with:
  - creator wallet
  - max members
  - contribution amount/cycle tracking
  - vault balance
  - Swig vault + quorum metadata
  - group token mint + transfer hook metadata
- [x] `members`, `contributions`, `yield_events`, `chain_events` tables

## Step 3 - Swig / Token-2022 integration touchpoints (Phase 2.2/2.3)

- [x] Swig vault metadata endpoint:
  - `POST /api/v1/groups/{groupID}/swig`
- [x] Token-2022 metadata endpoint:
  - `POST /api/v1/groups/{groupID}/token`
- [x] Devnet explorer helper endpoint:
  - `GET /api/v1/groups/{groupID}/explorer`

## Step 4 - AI Treasury Agent backend (Phase 3)

- [x] Agent execution endpoint:
  - `POST /api/v1/agent/run`
- [x] Decision loop implemented:
  - reserve threshold (`MIN_RESERVE_LAMPORTS`)
  - deploy percentage (`DEPLOY_PERCENT`, default 90%)
  - protocol pick via APY comparison (Kamino vs Jito bps env)
- [x] Structured logs for auditability
- [x] Safe failure mode:
  - skips state mutation when event/group update fails
- [x] Yield event write endpoint:
  - `POST /api/v1/groups/{groupID}/yield`

## Step 5 - Web3 and Helius endpoints (Phase 4 backend-facing)

- [x] Solana RPC balance endpoint:
  - `GET /api/v1/web3/balance?address=...`
- [x] Helius webhook ingestion endpoint:
  - `POST /api/v1/webhooks/helius`
- [x] Persisted webhook payload metadata in `chain_events`

## Step 6 - Env + config hardening

- [x] Added config/env support for:
  - `SOLANA_RPC_URL`
  - `HELIUS_API_KEY`
  - `SENDAI_API_KEY`
  - `MIN_RESERVE_LAMPORTS`
  - `DEPLOY_PERCENT`
  - `KAMINO_APY_BPS`
  - `JITO_APY_BPS`

## Verification

- [x] `go build ./...`
- [x] `go test ./...`

## Step 7 - Backend test coverage (unit + integration)

- [x] Unit tests:
  - `internal/config/config_test.go`
  - `internal/treasury/agent_test.go`
- [x] Integration tests (httptest):
  - `internal/web3/client_integration_test.go`
  - `internal/handlers/handlers_integration_test.go`
