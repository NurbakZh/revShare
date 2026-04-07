import { getOracleBaseUrl } from '@/lib/env'
import type {
    BusinessProfile,
    HealthResponse,
    RegisterBusinessDto,
    RegisterUserDto,
    Result,
    RevenueRecord,
    TokenListingDto,
    UserProfile,
} from '@/lib/api/types'

async function parseResult<T>(res: Response): Promise<Result<T>> {
    const text = await res.text()
    try {
        return JSON.parse(text) as Result<T>
    } catch {
        return {
            success: false,
            data: null,
            error: text || `HTTP ${res.status}`,
        }
    }
}

function url(path: string): string {
    const base = getOracleBaseUrl().replace(/\/$/, '')
    return `${base}${path.startsWith('/') ? path : `/${path}`}`
}

export async function fetchHealth(): Promise<Result<HealthResponse>> {
    const res = await fetch(url('/api/health'), { cache: 'no-store' })
    return parseResult<HealthResponse>(res)
}

export async function fetchBusinesses(): Promise<Result<BusinessProfile[]>> {
    const res = await fetch(url('/api/business'), { cache: 'no-store' })
    return parseResult<BusinessProfile[]>(res)
}

export async function fetchBusiness(
    pubkey: string,
): Promise<Result<BusinessProfile>> {
    const res = await fetch(url(`/api/business/${encodeURIComponent(pubkey)}`), {
        cache: 'no-store',
    })
    return parseResult<BusinessProfile>(res)
}

export async function registerBusiness(
    body: RegisterBusinessDto,
): Promise<Result<BusinessProfile>> {
    const res = await fetch(url('/api/business/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    })
    return parseResult<BusinessProfile>(res)
}

export async function fetchRevenueHistory(
    businessPubkey: string,
): Promise<Result<RevenueRecord[]>> {
    const res = await fetch(
        url(
            `/api/business/${encodeURIComponent(businessPubkey)}/revenue/history`,
        ),
        { cache: 'no-store' },
    )
    return parseResult<RevenueRecord[]>(res)
}

export async function simulateRevenue(
    businessPubkey: string,
): Promise<Result<RevenueRecord>> {
    const res = await fetch(
        url(
            `/api/business/${encodeURIComponent(businessPubkey)}/revenue/simulate`,
        ),
        { method: 'POST' },
    )
    return parseResult<RevenueRecord>(res)
}

export async function fetchUser(
    pubkey: string,
): Promise<Result<UserProfile>> {
    const res = await fetch(url(`/api/user/${encodeURIComponent(pubkey)}`), {
        cache: 'no-store',
    })
    return parseResult<UserProfile>(res)
}

export async function registerUser(
    body: RegisterUserDto,
): Promise<Result<UserProfile>> {
    const res = await fetch(url('/api/user/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    })
    return parseResult<UserProfile>(res)
}

export async function fetchMarketplaceListings(): Promise<
    Result<TokenListingDto[]>
> {
    const res = await fetch(url('/api/marketplace/listings'), {
        cache: 'no-store',
    })
    return parseResult<TokenListingDto[]>(res)
}

export async function registerListing(body: {
    listingPubkey: string
    businessPubkey: string
    sellerPubkey: string
    amount: number
    pricePerToken: number
}): Promise<Result<unknown>> {
    const res = await fetch(url('/api/marketplace/listings'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    })
    return parseResult<unknown>(res)
}

export async function cancelListingApi(listingPubkey: string): Promise<Result<unknown>> {
    const res = await fetch(
        url(`/api/marketplace/listings/${encodeURIComponent(listingPubkey)}`),
        { method: 'DELETE' },
    )
    return parseResult<unknown>(res)
}

export async function markListingSoldApi(listingPubkey: string): Promise<Result<unknown>> {
    const res = await fetch(
        url(`/api/marketplace/listings/${encodeURIComponent(listingPubkey)}/sold`),
        { method: 'POST' },
    )
    return parseResult<unknown>(res)
}

export async function fetchListingsForBusiness(
    businessPubkey: string,
): Promise<Result<TokenListingDto[]>> {
    const res = await fetch(
        url(
            `/api/marketplace/listings/${encodeURIComponent(businessPubkey)}`,
        ),
        { cache: 'no-store' },
    )
    return parseResult<TokenListingDto[]>(res)
}

export async function fetchBusinessesByOwner(
    ownerPubkey: string,
): Promise<BusinessProfile[]> {
    const r = await fetchBusinesses()
    if (!r.success || !r.data) return []
    return r.data.filter((b) => b.ownerPubkey === ownerPubkey)
}
