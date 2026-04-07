#!/bin/bash
set -e

PROGRAM_ID="EBzgZ4TU3tBtzfqLLmLpZcvoKKyuvyuseCkQ3MizCv8J"

# Generate a local keypair for solana CLI (needed by some commands)
mkdir -p /root/.config/solana
solana-keygen new --no-bip39-passphrase --silent --outfile /root/.config/solana/id.json 2>/dev/null || true

# Derive oracle pubkey from keypair JSON env var
echo "$ORACLE_KEYPAIR_JSON" > /tmp/oracle-keypair.json
ORACLE_PUBKEY=$(solana-keygen pubkey /tmp/oracle-keypair.json)
rm -f /tmp/oracle-keypair.json

echo "Oracle pubkey: $ORACLE_PUBKEY"
echo "Starting solana-test-validator with program $PROGRAM_ID..."

solana-test-validator \
  --reset \
  --bpf-program "$PROGRAM_ID" /app/revshare.so \
  2>&1 &
VALIDATOR_PID=$!

echo "Waiting for validator to be ready (up to 120s)..."
for i in $(seq 1 120); do
  if solana cluster-version --url http://localhost:8899 >/dev/null 2>&1; then
    echo "Validator is ready after ${i}s!"
    break
  fi
  if ! kill -0 $VALIDATOR_PID 2>/dev/null; then
    echo "Validator process died unexpectedly!"
    echo "=== validator.log ==="
    tail -50 test-ledger/validator.log 2>/dev/null || echo "(no log)"
    exit 1
  fi
  sleep 1
done

if ! solana cluster-version --url http://localhost:8899 >/dev/null 2>&1; then
  echo "Validator did not become ready in 120s, exiting"
  exit 1
fi

echo "Airdropping 1000 SOL to oracle: $ORACLE_PUBKEY"
solana airdrop 1000 "$ORACLE_PUBKEY" --url http://localhost:8899

echo "Localnet ready — Program ID: $PROGRAM_ID"

wait $VALIDATOR_PID
