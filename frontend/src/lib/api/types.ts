export type Result<T> = {
    success: boolean
    data: T | null
    error: string | null
}

export type BusinessProfile = {
    id: string
    pubkey: string
    ownerPubkey: string
    name: string
    description: string
    city: string
    logoUrl: string | null
    rank: 0 | 1 | 2 | 3
    raiseLimit: number
    targetRevenue: number
    consecutivePayments: number
    hasDefaulted: boolean
    createdAt: string
    updatedAt: string | null
}

export type RevenueRecord = {
    id: string
    businessPubkey: string
    epoch: number
    amount: number
    source: string
    txSignature: string | null
    createdAt: string
}

export type UserProfile = {
    id: string
    pubkey: string
    name: string
    avatarUrl: string | null
    bio: string | null
    hasBusiness: boolean
    createdAt: string
}

export type TokenListingDto = {
    id: string
    listingPubkey: string
    businessPubkey: string
    sellerPubkey: string
    amount: number
    pricePerToken: number
    status: 0 | 1 | 2
    createdAt: string
}

export type RegisterBusinessDto = {
    pubkey: string
    ownerPubkey: string
    name: string
    description: string
    city: string
    raiseLimit: number
    targetRevenue: number
    logoUrl?: string
}

export type RegisterUserDto = {
    pubkey: string
    name: string
    avatarUrl?: string
    bio?: string
}

export type HealthResponse = {
    status: string
    solana: boolean
    oraclePublicKey: string
    timestamp: string
}
