export interface Business {
    id: string
    pubkey: string
    name: string
    description: string
    category: string
    apy: number
    riskLevel: 'Low' | 'Medium' | 'High'
    tokenPrice: number
    totalTokens: number
    tokensLeft: number
    fundingProgress: number
    monthlyRevenue: number[]
    logo: string
    owner: string
    revenueSharePercent: number
    targetRevenue: number
    fundsReleased: number
}
