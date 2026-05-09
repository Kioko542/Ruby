# Ruby Smart Contracts (Anchor)

This workspace contains on-chain programs associated with backend phases 2, 3, and 5.

## Program

- `ruby_protocol`
  - `create_group`, `join_group`, `contribute`
  - `create_swig_proposal`, `approve_swig_proposal`
  - `create_loan_request`, `vote_loan_request`
  - `create_blink_action`, `execute_blink_action`
  - `record_yield_event`

## Local build/test

```bash
cd contracts
pnpm install
anchor build
anchor test
```

## Deploy scripts

```bash
cd contracts
./scripts/deploy-localnet.sh
# or
./scripts/deploy-devnet.sh
```

After deploy, copy `RUBY_PROGRAM_ID` into `backend/.env`. The generated IDL is mirrored to `contracts/idl/ruby_protocol.json` (used by `deploy-devnet.sh`); point `ANCHOR_IDL_PATH` at that file or at `target/idl/ruby_protocol.json` after a local `anchor build`.

## Backend mapping

The backend route layer in `backend/` currently mirrors the same domain and can be wired to CPI/transaction builders:

- Groups / contributions
- Swig proposal approvals
- Loan voting
- Blink creation/execution
- Yield event recording

For dev velocity, backend persists off-chain mirrors in Postgres while contracts define canonical state transitions for devnet/mainnet execution.
