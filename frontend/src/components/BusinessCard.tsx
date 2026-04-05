'use client'

import { Business } from '@/lib/data'
import { ArrowRight, TrendingUp } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React from 'react'
import { GlassCard } from './GlassCard'
import { GradientButton } from './GradientButton'

interface BusinessCardProps {
    business: Business
}

export function BusinessCard({ business }: BusinessCardProps) {
    const router = useRouter()

    const getRiskColor = (risk: string) => {
        switch (risk) {
            case 'Low':
                return 'text-green-500'
            case 'Medium':
                return 'text-yellow-500'
            case 'High':
                return 'text-red-500'
            default:
                return 'text-gray-500'
        }
    }

    const chartSlice = business.monthlyRevenue.slice(-6)
    const chartMax =
        chartSlice.length > 0 ? Math.max(...chartSlice, 1e-12) : 0

    return (
        <div className='w-full'>
            <GlassCard
                variant='hover'
                className='h-full p-6'
                onClick={() => router.push(`/business/${business.pubkey}`)}
            >
                <div className='mb-4 flex items-start justify-between'>
                    <div className='flex items-center gap-3'>
                        <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-2xl font-bold text-foreground'>
                            {business.logo || '·'}
                        </div>
                        <div>
                            <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                                {business.name}
                            </h3>
                            <p className='text-sm text-gray-600 dark:text-gray-400'>
                                {business.category || '—'}
                            </p>
                        </div>
                    </div>
                    <div
                        className={`rounded-full px-3 py-1 text-xs font-medium ${getRiskColor(business.riskLevel)} bg-gray-100 bg-opacity-10 dark:bg-white/5`}
                    >
                        {business.riskLevel} Risk
                    </div>
                </div>

                <p className='mb-4 line-clamp-2 text-sm text-gray-600 dark:text-gray-400'>
                    {business.description}
                </p>

                {chartSlice.length > 0 && (
                    <div className='mb-4 flex h-16 items-end gap-1'>
                        {chartSlice.map((revenue, index) => {
                            const height =
                                chartMax > 0 ? (revenue / chartMax) * 100 : 0
                            return (
                                <div
                                    key={index}
                                    className='flex-1 rounded-t bg-gradient-to-t from-purple-600 to-cyan-600 opacity-60 transition-opacity hover:opacity-100'
                                    style={{ height: `${height}%` }}
                                />
                            )
                        })}
                    </div>
                )}

                <div className='mb-4 grid grid-cols-2 gap-4'>
                    <div>
                        <div className='flex items-center gap-1 bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-2xl font-bold text-transparent'>
                            {business.apy}%
                            <TrendingUp size={20} className='text-green-500' />
                        </div>
                        <p className='text-xs text-gray-600 dark:text-gray-500'>
                            APY
                        </p>
                    </div>
                    <div>
                        <div className='text-2xl font-bold text-gray-900 dark:text-white'>
                            {business.tokenPrice > 0
                                ? `${business.tokenPrice} SOL`
                                : '—'}
                        </div>
                        <p className='text-xs text-gray-600 dark:text-gray-500'>
                            Per token
                        </p>
                    </div>
                </div>

                <div className='mb-4'>
                    <div className='mb-2 flex justify-between text-xs text-gray-600 dark:text-gray-400'>
                        <span>Funding Progress</span>
                        <span>{business.fundingProgress}%</span>
                    </div>
                    <div className='h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-white/5'>
                        <div
                            className='h-full rounded-full bg-gradient-to-r from-purple-600 to-cyan-600 transition-all duration-500'
                            style={{ width: `${business.fundingProgress}%` }}
                        />
                    </div>
                    <p className='mt-1 text-xs text-gray-600 dark:text-gray-500'>
                        {business.tokensLeft.toLocaleString()} /{' '}
                        {business.totalTokens.toLocaleString()} tokens left
                    </p>
                </div>

                <GradientButton
                    variant='primary'
                    size='md'
                    className='w-full'
                    onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/business/${business.pubkey}`)
                    }}
                >
                    Open
                    <ArrowRight size={18} className='ml-2' />
                </GradientButton>
            </GlassCard>
        </div>
    )
}
