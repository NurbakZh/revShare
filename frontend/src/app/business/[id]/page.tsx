'use client';

import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mockBusinesses } from '@/lib/data';
import { ArrowLeft, Shield, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import React, { useState } from 'react';
import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

export default function BusinessDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('overview');
    const [tokenAmount, setTokenAmount] = useState(10);
    const [showBuyModal, setShowBuyModal] = useState(false);

    const business = mockBusinesses.find((b) => b.id === params.id);

    if (!business) {
        return (
            <div className='container mx-auto px-4 py-16 text-center'>
                <p className='text-xl text-muted-foreground'>
                    Business not found
                </p>
                <Button onClick={() => router.push('/')} className='mt-4'>
                    Back to Marketplace
                </Button>
            </div>
        );
    }

    const chartData = business.monthlyRevenue.map((revenue, index) => ({
        month: [
            'Jan',
            'Feb',
            'Mar',
            'Apr',
            'May',
            'Jun',
            'Jul',
            'Aug',
            'Sep',
            'Oct',
            'Nov',
            'Dec',
        ][index],
        revenue: revenue / 1000,
    }));

    const totalCost = tokenAmount * business.tokenPrice;
    const estimatedMonthlyReturn = (totalCost * (business.apy / 100)) / 12;

    return (
        <div className='container mx-auto px-4 py-8 '>
            {/* Back Button */}
            <button
                onClick={() => router.push('/')}
                className='flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground'
            >
                <ArrowLeft size={20} />
                Back to Marketplace
            </button>

            {/* Hero Section */}
            <GlassCard className='mt-8 p-8'>
                <div className='grid grid-cols-1 gap-8 lg:grid-cols-2'>
                    {/* Left: Business Info */}
                    <div>
                        <div className='mb-6 flex items-center gap-4'>
                            <div className='text-6xl'>{business.logo}</div>
                            <div>
                                <h1 className='text-3xl font-bold text-foreground'>
                                    {business.name}
                                </h1>
                                <p className='text-muted-foreground'>
                                    {business.category}
                                </p>
                            </div>
                        </div>

                        <p className='mb-6 text-lg text-foreground/80'>
                            {business.description}
                        </p>

                        <div className='mb-6 grid grid-cols-2 gap-4'>
                            <div className='rounded-2xl border border-border bg-accent/5 p-4'>
                                <div className='mb-1 flex items-center gap-2 bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-2xl font-bold text-transparent'>
                                    {business.apy}%
                                    <TrendingUp
                                        size={24}
                                        className='text-green-500'
                                    />
                                </div>
                                <p className='text-sm text-muted-foreground'>
                                    Annual APY
                                </p>
                            </div>

                            <div className='rounded-2xl border border-border bg-accent/5 p-4'>
                                <div className='mb-1 text-2xl font-bold text-foreground'>
                                    {business.revenueSharePercent}%
                                </div>
                                <p className='text-sm text-muted-foreground'>
                                    Revenue Share
                                </p>
                            </div>

                            <div className='rounded-2xl border border-border bg-accent/5 p-4'>
                                <div className='mb-1 text-2xl font-bold text-foreground'>
                                    ${business.tokenPrice}
                                </div>
                                <p className='text-sm text-muted-foreground'>
                                    Token Price
                                </p>
                            </div>

                            <div className='rounded-2xl border border-border bg-accent/5 p-4'>
                                <div
                                    className={`mb-1 text-2xl font-bold ${
                                        business.riskLevel === 'Low'
                                            ? 'text-green-500'
                                            : business.riskLevel === 'Medium'
                                              ? 'text-yellow-500'
                                              : 'text-red-500'
                                    }`}
                                >
                                    {business.riskLevel}
                                </div>
                                <p className='text-sm text-muted-foreground'>
                                    Risk Level
                                </p>
                            </div>
                        </div>

                        <div className='space-y-4'>
                            <div>
                                <div className='mb-2 flex justify-between text-sm text-muted-foreground'>
                                    <span>Funding Progress</span>
                                    <span>{business.fundingProgress}%</span>
                                </div>
                                <div className='h-3 overflow-hidden rounded-full bg-accent/20'>
                                    <div
                                        className='h-full rounded-full bg-gradient-to-r from-purple-600 to-cyan-600 transition-all duration-500'
                                        style={{
                                            width: `${business.fundingProgress}%`,
                                        }}
                                    />
                                </div>
                                <p className='mt-2 text-sm text-muted-foreground/60'>
                                    {business.tokensLeft.toLocaleString()} /{' '}
                                    {business.totalTokens.toLocaleString()}{' '}
                                    tokens available
                                </p>
                            </div>

                            <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                                <Shield size={16} />
                                <span>
                                    Verified by RevShare • Owner:{' '}
                                    {business.owner}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Purchase Card */}
                    <GlassCard variant='bordered' className='h-fit p-6'>
                        <h2 className='mb-6 text-xl font-bold text-foreground'>
                            Purchase Tokens
                        </h2>

                        <div className='space-y-6'>
                            <div>
                                <label className='mb-2 block text-sm font-medium text-muted-foreground'>
                                    Number of Tokens
                                </label>
                                <Input
                                    type='number'
                                    value={tokenAmount}
                                    onChange={(e) =>
                                        setTokenAmount(
                                            Math.max(
                                                1,
                                                parseInt(e.target.value) || 1,
                                            ),
                                        )
                                    }
                                    min='1'
                                    max={business.tokensLeft}
                                />
                                <input
                                    type='range'
                                    value={tokenAmount}
                                    onChange={(e) =>
                                        setTokenAmount(parseInt(e.target.value))
                                    }
                                    min='1'
                                    max={Math.min(100, business.tokensLeft)}
                                    className='mt-3 w-full accent-primary'
                                />
                            </div>

                            <div className='space-y-3 rounded-2xl border border-border bg-accent/5 p-4'>
                                <div className='flex justify-between'>
                                    <span className='text-muted-foreground'>
                                        Price per token
                                    </span>
                                    <span className='font-semibold text-foreground'>
                                        ${business.tokenPrice}
                                    </span>
                                </div>
                                <div className='flex justify-between'>
                                    <span className='text-muted-foreground'>
                                        Total cost
                                    </span>
                                    <span className='font-semibold text-foreground'>
                                        ${totalCost.toLocaleString()}
                                    </span>
                                </div>
                                <div className='border-t border-border pt-3'>
                                    <div className='flex justify-between'>
                                        <span className='text-muted-foreground'>
                                            Est. monthly return
                                        </span>
                                        <span className='font-bold text-green-500'>
                                            ${estimatedMonthlyReturn.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <Button
                                variant='brand'
                                size='lg'
                                className='w-full'
                                onClick={() => setShowBuyModal(true)}
                            >
                                Buy {tokenAmount} Token
                                {tokenAmount > 1 ? 's' : ''} for $
                                {totalCost.toLocaleString()}
                            </Button>

                            <p className='text-center text-xs text-muted-foreground/60'>
                                Transaction fee: ~0.00005 SOL
                            </p>
                        </div>
                    </GlassCard>
                </div>
            </GlassCard>

            {/* Tabs / Dashboard */}
            <div className='mt-8 flex gap-4 border-b border-border'>
                {['overview', 'revenue', 'marketplace'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`relative px-6 py-3 font-medium transition-colors ${
                            activeTab === tab
                                ? 'text-foreground'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        {activeTab === tab && (
                            <div className='absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-600 to-cyan-600' />
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
                <GlassCard className='p-8'>
                    <h2 className='mb-6 text-2xl font-bold text-foreground'>
                        Business Overview
                    </h2>
                    <div className='space-y-6'>
                        <div>
                            <h3 className='mb-2 font-semibold text-foreground'>
                                About
                            </h3>
                            <p className='text-muted-foreground'>
                                {business.description} This business has been
                                verified by RevShare and is actively generating
                                revenue. Token holders receive monthly dividends
                                based on the business performance.
                            </p>
                        </div>
                        <div>
                            <h3 className='mb-2 font-semibold text-foreground'>
                                Revenue Model
                            </h3>
                            <p className='text-muted-foreground'>
                                {business.revenueSharePercent}% of monthly
                                revenue is distributed to token holders
                                proportionally. Payments are made on the 1st of
                                each month via smart contract.
                            </p>
                        </div>
                        <div>
                            <h3 className='mb-2 font-semibold text-foreground'>
                                Target Metrics
                            </h3>
                            <p className='text-muted-foreground'>
                                Target monthly revenue: $
                                {business.targetRevenue.toLocaleString()}
                                <br />
                                Current monthly revenue: $
                                {business.monthlyRevenue[
                                    business.monthlyRevenue.length - 1
                                ].toLocaleString()}
                            </p>
                        </div>
                    </div>
                </GlassCard>
            )}

            {activeTab === 'revenue' && (
                <GlassCard className='p-8'>
                    <h2 className='mb-6 text-2xl font-bold text-foreground'>
                        Revenue History
                    </h2>
                    <div className='h-80 w-full'>
                        <ResponsiveContainer width='100%' height='100%'>
                            <LineChart data={chartData}>
                                <CartesianGrid
                                    strokeDasharray='3 3'
                                    stroke='currentColor'
                                    className='text-border'
                                    opacity={0.1}
                                />
                                <XAxis
                                    dataKey='month'
                                    stroke='currentColor'
                                    className='text-muted-foreground'
                                    style={{ fontSize: '12px' }}
                                />
                                <YAxis
                                    stroke='currentColor'
                                    className='text-muted-foreground'
                                    style={{ fontSize: '12px' }}
                                    tickFormatter={(value) => `$${value}k`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'var(--background)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '12px',
                                    }}
                                    itemStyle={{ color: 'var(--foreground)' }}
                                />
                                <Line
                                    type='monotone'
                                    dataKey='revenue'
                                    stroke='#8B5CF6'
                                    strokeWidth={3}
                                    dot={{ fill: '#8B5CF6', r: 4 }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </GlassCard>
            )}

            {activeTab === 'marketplace' && (
                <GlassCard className='p-8'>
                    <h2 className='mb-6 text-2xl font-bold text-foreground'>
                        Secondary Marketplace
                    </h2>
                    <p className='text-muted-foreground'>
                        No listings available for this business yet. Check the{' '}
                        <Link
                            href='/marketplace'
                            className='text-primary hover:underline'
                        >
                            main marketplace
                        </Link>{' '}
                        for other opportunities.
                    </p>
                </GlassCard>
            )}

            {/* Buy Modal */}
            {showBuyModal && (
                <div
                    className='m-0! fixed bottom-0 left-0 right-0 top-0 z-[99999] flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-lg duration-300 animate-in fade-in'
                    onClick={() => setShowBuyModal(false)}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className='w-full max-w-md'
                    >
                        <GlassCard className='p-8'>
                            <h2 className='mb-4 text-2xl font-bold text-foreground'>
                                Confirm Purchase
                            </h2>
                            <div className='mb-6 space-y-4'>
                                <div className='flex justify-between'>
                                    <span className='text-muted-foreground'>
                                        Business
                                    </span>
                                    <span className='font-semibold text-foreground'>
                                        {business.name}
                                    </span>
                                </div>
                                <div className='flex justify-between'>
                                    <span className='text-muted-foreground'>
                                        Tokens
                                    </span>
                                    <span className='font-semibold text-foreground'>
                                        {tokenAmount}
                                    </span>
                                </div>
                                <div className='flex justify-between'>
                                    <span className='text-muted-foreground'>
                                        Total Cost
                                    </span>
                                    <span className='font-semibold text-foreground'>
                                        ${totalCost.toLocaleString()}
                                    </span>
                                </div>
                                <div className='border-t border-border pt-4'>
                                    <div className='flex justify-between'>
                                        <span className='text-muted-foreground'>
                                            Est. Monthly Return
                                        </span>
                                        <span className='font-bold text-green-500'>
                                            ${estimatedMonthlyReturn.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className='flex gap-3'>
                                <Button
                                    variant='outline'
                                    className='flex-1'
                                    onClick={() => setShowBuyModal(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant='brand'
                                    className='flex-1 bg-gradient-to-r from-purple-600 to-cyan-600 transition-all hover:shadow-lg hover:shadow-purple-500/30 active:scale-95'
                                    onClick={() => {
                                        setShowBuyModal(false);
                                    }}
                                >
                                    Confirm
                                </Button>
                            </div>
                        </GlassCard>
                    </div>
                </div>
            )}
        </div>
    );
}
