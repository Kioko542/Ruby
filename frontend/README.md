# frontend

Next.js starter with Tailwind CSS and `@solana/kit` for wallet connection and Solana hooks.

This scaffold is integrated with the Go backend for:
- Solana balance reads (`GET /api/v1/web3/balance`)
- Group join flow (`POST /api/v1/groups/{groupID}/join`)
- Referral invite links (`POST /api/v1/groups/{groupID}/invite-links`)

## Getting Started

```shell
npx -y create-solana-dapp@latest -t solana-foundation/templates/kit/frontend
```

```shell
npm install
npm run dev
```

Set backend URL for local integration:

```shell
export NEXT_PUBLIC_BACKEND_URL=http://localhost:8080
```
