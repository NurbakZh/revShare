#!/bin/bash
set -e

PROGRAM_ID="EBzgZ4TU3tBtzfqLLmLpZcvoKKyuvyuseCkQ3MizCv8J"

# Derive oracle pubkey from keypair JSON
echo "$ORACLE_KEYPAIR_JSON" > /tmp/oracle-keypair.json
ORACLE_PUBKEY=$(solana-keygen pubkey /tmp/oracle-keypair.json)
rm -f /tmp/oracle-keypair.json

echo "Starting solana-test-validator with program $PROGRAM_ID..."
solana-test-validator \
  --reset \
  --quiet \
  --bpf-program "$PROGRAM_ID" /app/revshare.so \
  &
VALIDATOR_PID=$!

echo "Waiting for validator to be ready..."
for i in $(seq 1 60); do
  if solana cluster-version --url http://localhost:8899 >/dev/null 2>&1; then
    echo "Validator is ready!"
    break
  fi
  sleep 1
done

echo "Airdropping 1000 SOL to oracle: $ORACLE_PUBKEY"
solana airdrop 1000 "$ORACLE_PUBKEY" --url http://localhost:8899

echo "Localnet ready — Program ID: $PROGRAM_ID"

wait $VALIDATOR_PID
