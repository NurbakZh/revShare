/**
 * Demo seed script — creates 2 demo businesses on localnet and simulates revenue.
 * Run: yarn seed
 */
import * as anchor from '@coral-xyz/anchor'
import {
    Keypair,
    Connection,
    LAMPORTS_PER_SOL,
    PublicKey,
    SystemProgram,
    SYSVAR_RENT_PUBKEY,
} from '@solana/web3.js'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { createHash } from 'crypto'
import BN from 'bn.js'
import { readFileSync } from 'fs'
import { join } from 'path'

const RPC_URL = process.env.SOLANA_RPC_URL ?? 'http://127.0.0.1:8899'
const ORACLE_API = process.env.ORACLE_API_URL ?? 'http://localhost:5000'
const PROGRAM_ID = new PublicKey('EBzgZ4TU3tBtzfqLLmLpZcvoKKyuvyuseCkQ3MizCv8J')

// Oracle keypair — same bytes as appsettings.Development.json
const ORACLE_KP = Keypair.fromSecretKey(
    Buffer.from([
        104, 87, 27, 54, 102, 238, 105, 189, 162, 233, 203, 131, 94, 168, 209, 210,
        31, 40, 76, 243, 44, 115, 127, 228, 43, 36, 192, 232, 163, 3, 113, 24,
        67, 209, 110, 118, 44, 151, 6, 139, 169, 86, 182, 222, 90, 216, 177, 216,
        100, 70, 89, 58, 5, 254, 239, 249, 172, 124, 61, 130, 174, 230, 100, 249,
    ]),
)

// Deterministic demo keypairs — same derivation as /demo page in the frontend
function deterministicKp(name: string): Keypair {
    const seed = createHash('sha256').update(`revshare_demo_${name}_v1`).digest()
    return Keypair.fromSeed(seed)
}

export const DEMO_OWNER_KP = deterministicKp('owner')
export const DEMO_INVESTOR_KP = deterministicKp('investor')

const BUSINESSES = [
    {
        id: new BN(1),
        name: 'Almaty Coffee Roasters',
        description:
            'Premium specialty coffee roastery sourcing single-origin beans from Ethiopia and Colombia. Founded in 2019.',
        city: 'Almaty',
        totalTokens: new BN(100),
        tokenPrice: new BN(50_000_000),   // 0.05 SOL per token
        revenueShareBps: 1500,             // 15%
        raiseLimit: new BN(5_000_000_000), // 5 SOL = 100 tokens × 0.05 SOL
        collateralAmount: new BN(1_500_000_000), // 1.5 SOL = 30% of raiseLimit
        targetRevenue: new BN(500_000_000), // 0.5 SOL/month
    },
    {
        id: new BN(2),
        name: 'Steppe Bakery',
        description:
            'Traditional Kazakh bakery chain with 5 locations. Fresh bread and pastries baked daily since 2015.',
        city: 'Astana',
        totalTokens: new BN(200),
        tokenPrice: new BN(20_000_000),    // 0.02 SOL per token
        revenueShareBps: 1000,              // 10%
        raiseLimit: new BN(4_000_000_000), // 4 SOL = 200 tokens × 0.02 SOL
        collateralAmount: new BN(1_200_000_000), // 1.2 SOL = 30% of raiseLimit
        targetRevenue: new BN(800_000_000), // 0.8 SOL/month
    },
]

function sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms))
}

async function retryAirdrop(conn: Connection, pubkey: PublicKey, sol: number) {
    for (let i = 0; i < 5; i++) {
        try {
            const sig = await conn.requestAirdrop(pubkey, sol * LAMPORTS_PER_SOL)
            await conn.confirmTransaction(sig, 'confirmed')
            console.log(`  ✓ ${sol} SOL → ${pubkey.toBase58().slice(0, 8)}...`)
            return
        } catch {
            await sleep(2000)
        }
    }
    throw new Error(`Airdrop failed for ${pubkey.toBase58()}`)
}

async function waitForOracle() {
    for (let i = 0; i < 60; i++) {
        try {
            const r = await fetch(`${ORACLE_API}/api/health`)
            if (r.ok) {
                console.log('  ✓ Oracle API ready')
                return
            }
        } catch {}
        process.stdout.write(`\r  Waiting for oracle... ${i + 1}s`)
        await sleep(1000)
    }
    throw new Error('Oracle API never became healthy')
}

async function registerWithOracle(
    pubkey: string,
    ownerPubkey: string,
    biz: (typeof BUSINESSES)[0],
) {
    const res = await fetch(`${ORACLE_API}/api/business/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            pubkey,
            ownerPubkey,
            name: biz.name,
            description: biz.description,
            city: biz.city,
            raiseLimit: biz.raiseLimit.toNumber(),
            targetRevenue: biz.targetRevenue.toNumber(),
        }),
    })
    const json = (await res.json()) as { success: boolean }
    if (!json.success && !JSON.stringify(json).includes('already')) {
        throw new Error(`Oracle register failed: ${JSON.stringify(json)}`)
    }
    console.log(`  ✓ Registered in oracle`)
}

async function simulateRevenue(pubkey: string) {
    const res = await fetch(
        `${ORACLE_API}/api/business/${encodeURIComponent(pubkey)}/revenue/simulate`,
        { method: 'POST' },
    )
    const json = (await res.json()) as { success: boolean; data?: { revenueAmount?: number }; error?: string }
    if (!json.success) {
        // Epoch already exists — idempotent, skip
        console.log(`  ⚡ Skipped (epoch already distributed): ${json.error ?? ''}`)
        return
    }
    console.log(`  ✓ Revenue epoch: ${json.data?.revenueAmount ?? '?'} lamports`)
}

async function main() {
    console.log('🌱 Seeding revShare demo data...\n')
    console.log(`   RPC:        ${RPC_URL}`)
    console.log(`   Oracle API: ${ORACLE_API}\n`)

    const conn = new Connection(RPC_URL, 'confirmed')

    console.log('Funding demo accounts...')
    await retryAirdrop(conn, DEMO_OWNER_KP.publicKey, 50)
    await retryAirdrop(conn, DEMO_INVESTOR_KP.publicKey, 50)

    const idlPath = join(__dirname, '../frontend/src/lib/solana/idl/revshare.json')
    const idl = JSON.parse(readFileSync(idlPath, 'utf8'))

    const provider = new anchor.AnchorProvider(conn, new anchor.Wallet(DEMO_OWNER_KP), {
        commitment: 'confirmed',
    })
    const program = new anchor.Program(idl, provider)

    console.log('\nWaiting for oracle API...')
    await waitForOracle()

    for (const biz of BUSINESSES) {
        console.log(`\n📦 ${biz.name}`)

        const idBytes = biz.id.toArrayLike(Buffer, 'le', 8)
        const [poolPda] = PublicKey.findProgramAddressSync(
            [Buffer.from('business'), DEMO_OWNER_KP.publicKey.toBuffer(), idBytes],
            PROGRAM_ID,
        )
        const [mintPda] = PublicKey.findProgramAddressSync(
            [Buffer.from('mint'), poolPda.toBuffer()],
            PROGRAM_ID,
        )
        const [collateralVaultPda] = PublicKey.findProgramAddressSync(
            [Buffer.from('collateral_vault'), poolPda.toBuffer()],
            PROGRAM_ID,
        )
        const [fundsVaultPda] = PublicKey.findProgramAddressSync(
            [Buffer.from('funds_vault'), poolPda.toBuffer()],
            PROGRAM_ID,
        )

        const existing = await conn.getAccountInfo(poolPda)
        if (existing) {
            console.log(`  ⚡ Already on-chain`)
        } else {
            await (program.methods as any)
                .initializeBusiness({
                    id: biz.id,
                    totalTokens: biz.totalTokens,
                    tokenPrice: biz.tokenPrice,
                    revenueShareBps: biz.revenueShareBps,
                    collateralAmount: biz.collateralAmount,
                    targetRevenue: biz.targetRevenue,
                    oracleAuthority: ORACLE_KP.publicKey,
                })
                .accounts({
                    owner: DEMO_OWNER_KP.publicKey,
                    businessPool: poolPda,
                    tokenMint: mintPda,
                    collateralVault: collateralVaultPda,
                    fundsVault: fundsVaultPda,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: SystemProgram.programId,
                    rent: SYSVAR_RENT_PUBKEY,
                })
                .signers([DEMO_OWNER_KP])
                .rpc()
            console.log(`  ✓ On-chain: ${poolPda.toBase58().slice(0, 12)}...`)
        }

        await registerWithOracle(poolPda.toBase58(), DEMO_OWNER_KP.publicKey.toBase58(), biz)

        console.log('  Simulating 2 revenue epochs...')
        for (let i = 0; i < 2; i++) {
            await sleep(2000)
            await simulateRevenue(poolPda.toBase58())
        }
    }

    console.log('\n✅ Seed complete!\n')
    console.log('Demo wallets:')
    console.log(`  Owner:    ${DEMO_OWNER_KP.publicKey.toBase58()}`)
    console.log(`  Investor: ${DEMO_INVESTOR_KP.publicKey.toBase58()}`)
    console.log('\nVisit /demo on the frontend to import keypairs into Phantom.\n')
}

main().catch((e) => {
    console.error('\n❌ Seed failed:', e)
    process.exit(1)
})
