# Helius webhook setup (Ruby backend)

The API accepts Solana notifications at:

`POST https://<your-render-service-host>/api/v1/webhooks/helius`

## 1. Secure the endpoint (recommended)

1. Generate a long random secret (e.g. 32+ bytes).
2. Set **`HELIUS_API_KEY`** on Render to that value (same as used in `internal/config`).
3. In the Helius dashboard, configure the webhook HTTP destination to send header:

   `X-Helius-Api-Key: <same value as HELIUS_API_KEY>`

If `HELIUS_API_KEY` is empty, the handler accepts unsigned traffic (fine for local dev only).

## 2. Payload formats the parser understands

The Go parser (`internal/webhook`) normalizes events as follows.

### A. Explicit JSON (simplest for demos)

Single object POST body:

```json
{
  "instruction": "contribute",
  "group_id": "g_abc123",
  "member_id": "m_xyz",
  "wallet_address": "<base58 wallet>",
  "amount": 50000000,
  "cycle_number": 1,
  "signature": "<tx signature>"
}
```

Yield example:

```json
{
  "instruction": "yield_event",
  "group_id": "g_abc123",
  "amount_deposited": 1000000000,
  "protocol": "kamino",
  "apy": 7.5,
  "signature": "<tx signature>"
}
```

### B. Program logs (optional)

If the transaction includes logs containing:

`Program log: ruby:contribute:<group_id>:<wallet>:<lamports>:<cycle>`

the parser can infer `contribute`. The on-chain program does not emit this by default; use (A) or configure Helius to attach custom fields.

### C. Helius Enhanced Webhooks

Helius often sends a richer envelope (arrays, nested `transaction`, etc.). The handler always **persists the raw body** to `chain_events`. Parsed contribute/yield side effects only run when the payload matches (A) or log patterns in (B). If you use Enhanced Webhooks, add a **Transform** or **Notification** step that POSTs the explicit shape in (A), or extend `ParseHeliusMap` for your envelope.

## 3. Render & WebSockets

Render **Web Services** support HTTP **Upgrade** for WebSockets on the same host as your API. The Ruby app exposes:

`GET wss://<host>/api/v1/ws`

No separate “socket service” is required. Ensure clients use **`https` / `wss`** in production so browsers allow the connection.

To inspect your Render service from Cursor, select the **Render** MCP workspace when prompted, then use **list_services** / **get_service**.

## 4. Backend env summary

| Variable            | Role                                      |
|---------------------|-------------------------------------------|
| `HELIUS_API_KEY`    | Validates `X-Helius-Api-Key` on webhook   |
| `RUBY_PROGRAM_ID`   | Filters / parses program-specific data  |
| `SOLANA_RPC_URL`    | RPC used for balance checks & treasury  |
