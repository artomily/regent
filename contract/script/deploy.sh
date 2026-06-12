#!/usr/bin/env bash
# Deploy RegentMandate to Base Sepolia.
#
# Usage:
#   PRIVATE_KEY=0x... ./script/deploy.sh
#
# After deploying, set the address in:
#   frontend/.env.local  -> NEXT_PUBLIC_MANDATE_CONTRACT=0x...
#   ai-agent/.env        -> MANDATE_CONTRACT=0x...
set -euo pipefail
cd "$(dirname "$0")/.."

: "${PRIVATE_KEY:?Set PRIVATE_KEY to the deployer key}"
RPC_URL="${RPC_URL:-https://sepolia.base.org}"

forge create src/RegentMandate.sol:RegentMandate \
  --rpc-url "$RPC_URL" \
  --private-key "$PRIVATE_KEY" \
  --broadcast
