import { getProgramId } from '@/lib/env'
import { BN } from '@coral-xyz/anchor'
import { PublicKey } from '@solana/web3.js'

export function getBusinessPoolPda(ownerPubkey: PublicKey, id: number) {
    const idBytes = new BN(id).toArrayLike(Buffer, 'le', 8)
    return PublicKey.findProgramAddressSync(
        [Buffer.from('business'), ownerPubkey.toBuffer(), idBytes],
        getProgramId(),
    )
}

export function getTokenMintPda(businessPoolPda: PublicKey) {
    return PublicKey.findProgramAddressSync(
        [Buffer.from('mint'), businessPoolPda.toBuffer()],
        getProgramId(),
    )
}

export function getCollateralVaultPda(businessPoolPda: PublicKey) {
    return PublicKey.findProgramAddressSync(
        [Buffer.from('collateral_vault'), businessPoolPda.toBuffer()],
        getProgramId(),
    )
}

export function getFundsVaultPda(businessPoolPda: PublicKey) {
    return PublicKey.findProgramAddressSync(
        [Buffer.from('funds_vault'), businessPoolPda.toBuffer()],
        getProgramId(),
    )
}

export function getVaultPda(businessPoolPda: PublicKey) {
    return getFundsVaultPda(businessPoolPda)
}

export function getHolderClaimPda(
    businessPoolPda: PublicKey,
    holderPubkey: PublicKey,
) {
    return PublicKey.findProgramAddressSync(
        [Buffer.from('claim'), businessPoolPda.toBuffer(), holderPubkey.toBuffer()],
        getProgramId(),
    )
}

export function getRevenueEpochPda(businessPoolPda: PublicKey, epoch: number) {
    const epochBytes = new BN(epoch).toArrayLike(Buffer, 'le', 8)
    return PublicKey.findProgramAddressSync(
        [Buffer.from('epoch'), businessPoolPda.toBuffer(), epochBytes],
        getProgramId(),
    )
}

export function getTokenListingPda(
    businessPoolPda: PublicKey,
    sellerPubkey: PublicKey,
) {
    return PublicKey.findProgramAddressSync(
        [
            Buffer.from('listing'),
            businessPoolPda.toBuffer(),
            sellerPubkey.toBuffer(),
        ],
        getProgramId(),
    )
}
