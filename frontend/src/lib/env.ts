import { PublicKey } from '@solana/web3.js'

const DEFAULT_ORACLE = ''
const DEFAULT_RPC = 'http://127.0.0.1:8899'
const DEFAULT_PROGRAM_ID = 'EBzgZ4TU3tBtzfqLLmLpZcvoKKyuvyuseCkQ3MizCv8J'

export function getOracleBaseUrl(): string {
    const u = process.env.NEXT_PUBLIC_ORACLE_URL?.trim()
    return u || DEFAULT_ORACLE
}

export function getSolanaRpcUrl(): string {
    const u = process.env.NEXT_PUBLIC_SOLANA_RPC?.trim()
    return u || DEFAULT_RPC
}

export function getProgramId(): PublicKey {
    const raw = process.env.NEXT_PUBLIC_PROGRAM_ID?.trim() || DEFAULT_PROGRAM_ID
    return new PublicKey(raw)
}

export function isLocalnet(): boolean {
    const rpc = getSolanaRpcUrl().toLowerCase()
    return rpc.includes('127.0.0.1') || rpc.includes('localhost')
}

export function getSolanaExplorerTxUrl(signature: string): string {
    const rpc = getSolanaRpcUrl().toLowerCase()
    const enc = encodeURIComponent(signature)
    const isMainnet =
        rpc.includes('mainnet') ||
        (rpc.includes('helius') && !rpc.includes('devnet'))
    if (isMainnet) return `https://explorer.solana.com/tx/${enc}`
    return `https://explorer.solana.com/tx/${enc}?cluster=devnet`
}
