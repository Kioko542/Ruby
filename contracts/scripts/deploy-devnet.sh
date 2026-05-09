#!/usr/bin/env bash
set -euo pipefail

echo "Switching Solana CLI to devnet..."
solana config set --url https://api.devnet.solana.com >/dev/null

echo "Building anchor program..."
anchor build

echo "Deploying ruby_protocol to devnet..."
anchor deploy --provider.cluster devnet

PROGRAM_ID="$(solana address -k target/deploy/ruby_protocol-keypair.json)"
mkdir -p idl
cp -f target/idl/ruby_protocol.json idl/ruby_protocol.json
IDL_PATH="$(pwd)/idl/ruby_protocol.json"

echo ""
echo "Deployment complete."
echo "RUBY_PROGRAM_ID=${PROGRAM_ID}"
echo "ANCHOR_IDL_PATH=${IDL_PATH}"
echo ""
echo "Add these to backend/.env and restart backend."
