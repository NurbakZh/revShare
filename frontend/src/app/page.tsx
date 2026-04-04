'use client'

import { BusinessCard } from '@/components/BusinessCard'
import { GlassCard } from '@/components/GlassCard'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { fetchBusinesses } from '@/lib/api/oracle'
import { profileToBusiness } from '@/lib/businessView'
import type { Business } from '@/lib/data'
import { fetchBusinessPoolAccount } from '@/lib/solana/helpers'
import { DollarSign, Filter, Search, Shield, TrendingUp } from 'lucide-react'
import { useConnection } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

export default function Home() {
    const { connection } = useConnection()
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('All')
    const [selectedRisk, setSelectedRisk] = useState('All')
    const [sortBy, setSortBy] = useState('apy')
    const [businesses, setBusinesses] = useState<Business[]>([])
    const [loading, setLoading] = useState(true)
    const [apiError, setApiError] = useState<string | null>(null)

    const load = useCallback(async () => {
        setLoading(true)
        setApiError(null)
        const res = await fetchBusinesses()
        if (!res.success) {
            setApiError(res.error || 'Request failed')
            setBusinesses([])
            setLoading(false)
            return
        }

        const list = res.data ?? []
        const merged: Business[] = []
        for (const p of list) {
            let pool = null
            try {
                pool = await fetchBusinessPoolAccount(
                    connection,
                    new PublicKey(p.pubkey),
                )
            } catch {
                pool = null
            }
            merged.push(profileToBusiness(p, pool))
        }
        setBusinesses(merged)
        setLoading(false)
    }, [connection])

    useEffect(() => {
        load()
    }, [load])

    const categories = useMemo(() => {
        const s = new Set<string>()
        businesses.forEach((b) => s.add(b.category))
        return ['All', ...Array.from(s).sort()]
    }, [businesses])

    const riskLevels = ['All', 'Low', 'Medium', 'High']

    const filteredBusinesses = businesses
        .filter((b) => {
            const matchesSearch =
                b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                b.description.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesCategory =
                selectedCategory === 'All' || b.category === selectedCategory
            const matchesRisk =
                selectedRisk === 'All' || b.riskLevel === selectedRisk
            return matchesSearch && matchesCategory && matchesRisk
        })
        .sort((a, b) => {
            if (sortBy === 'apy') return b.apy - a.apy
            if (sortBy === 'funding')
                return b.fundingProgress - a.fundingProgress
            if (sortBy === 'price') return a.tokenPrice - b.tokenPrice
            return 0
        })

    const count = businesses.length
    const avgApy =
        count > 0
            ? businesses.reduce((s, b) => s + b.apy, 0) / count
            : 0
    const withOnChainPool = businesses.filter((b) => b.totalTokens > 0).length

    return (
        <div className='container mx-auto px-4 py-8 '>
            <div className='py-8 text-center'>
                <h1 className='bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 bg-clip-text text-5xl font-bold text-transparent md:text-6xl'>
                    Invest in Real Businesses
                </h1>
                <p className='mx-auto mt-4 max-w-2xl text-xl text-muted-foreground'>
                    Buy revenue-sharing tokens from verified small businesses.
                    Earn monthly dividends on Solana.
                </p>
            </div>

            {apiError && (
                <p className='mb-4 text-center text-sm text-amber-600 dark:text-amber-400'>
                    {apiError}
                </p>
            )}

            <div className='mt-8 grid grid-cols-1 gap-6 md:grid-cols-3'>
                <GlassCard className='p-6'>
                    <div className='flex items-center gap-4'>
                        <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-cyan-600'>
                            <DollarSign className='text-white' size={24} />
                        </div>
                        <div>
                            <div className='text-2xl font-bold text-foreground'>
                                {loading ? '…' : count}
                            </div>
                            <p className='text-sm text-muted-foreground'>
                                Businesses
                            </p>
                        </div>
                    </div>
                </GlassCard>

                <GlassCard className='p-6'>
                    <div className='flex items-center gap-4'>
                        <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600'>
                            <TrendingUp className='text-white' size={24} />
                        </div>
                        <div>
                            <div className='text-2xl font-bold text-foreground'>
                                {avgApy > 0 ? `${avgApy.toFixed(1)}%` : '—'}
                            </div>
                            <p className='text-sm text-muted-foreground'>
                                Avg APY
                            </p>
                        </div>
                    </div>
                </GlassCard>

                <GlassCard className='p-6'>
                    <div className='flex items-center gap-4'>
                        <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-600 to-purple-600'>
                            <Shield className='text-white' size={24} />
                        </div>
                        <div>
                            <div className='text-2xl font-bold text-foreground'>
                                {loading ? '…' : withOnChainPool}
                            </div>
                            <p className='text-sm text-muted-foreground'>
                                With pool on RPC
                            </p>
                        </div>
                    </div>
                </GlassCard>
            </div>

            <GlassCard className='mt-8 p-6'>
                <div className='grid grid-cols-1 gap-4 md:grid-cols-12'>
                    <div className='relative md:col-span-5'>
                        <Search
                            className='absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground'
                            size={20}
                        />
                        <Input
                            placeholder='Search businesses...'
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className='pl-12'
                        />
                    </div>

                    <div className='md:col-span-3'>
                        <Select
                            value={selectedCategory}
                            onValueChange={setSelectedCategory}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder='Category' />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map((cat) => (
                                    <SelectItem key={cat} value={cat}>
                                        {cat}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className='md:col-span-2'>
                        <Select
                            value={selectedRisk}
                            onValueChange={setSelectedRisk}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder='Risk' />
                            </SelectTrigger>
                            <SelectContent>
                                {riskLevels.map((risk) => (
                                    <SelectItem key={risk} value={risk}>
                                        {risk} Risk
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className='md:col-span-2'>
                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger>
                                <SelectValue placeholder='Sort by' />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value='apy'>Highest APY</SelectItem>
                                <SelectItem value='funding'>
                                    Funding %
                                </SelectItem>
                                <SelectItem value='price'>
                                    Price: Low to High
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </GlassCard>

            <div className='mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
                {filteredBusinesses.map((business) => (
                    <BusinessCard key={business.id} business={business} />
                ))}
            </div>

            {!loading && filteredBusinesses.length === 0 && (
                <div className='py-16 text-center'>
                    <Filter
                        size={48}
                        className='mx-auto mb-4 text-muted-foreground opacity-20'
                    />
                    <p className='text-xl text-muted-foreground'>
                        {businesses.length === 0
                            ? 'No businesses from API'
                            : 'Nothing matches filters'}
                    </p>
                </div>
            )}
        </div>
    )
}
