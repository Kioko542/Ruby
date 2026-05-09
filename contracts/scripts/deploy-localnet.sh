#!/usr/bin/env bash
set -euo pipefail

echo "Building anchor program..."
anchor build

echo "Deploying to localnet..."
anchor deploy

echo "Program IDs:"
solana address -k target/deploy/ruby_protocol-keypair.json

echo "IDL path:"
echo "$(pwd)/target/idl/ruby_protocol.json"
