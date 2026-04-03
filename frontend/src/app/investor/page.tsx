'use client';

import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { mockInvestments } from '@/lib/data';
import { cn } from '@/lib/utils';
import { ArrowRight, DollarSign, Gift, TrendingUp, Wallet } from 'lucide-react';
import Link from 'next/link';
import React from 'react';
import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

export default function InvestorDashboard() {
    const totalPortfolioValue = mockInvestments.reduce(
        (sum, inv) => sum + inv.investmentValue,
        0,
    );
    const totalMonthlyEarnings = mockInvestments.reduce(
        (sum, inv) => sum + inv.monthlyEarnings,
        0,
    );
    const totalEarned = mockInvestments.reduce(
        (sum, inv) => sum + inv.totalEarned,
        0,
    );
    const avgAPY =
        mockInvestments.reduce((sum, inv) => sum + inv.apy, 0) /
        mockInvestments.length;

    const earningsData = [
        { month: 'Jan', earnings: 850 },
        { month: 'Feb', earnings: 920 },
        { month: 'Mar', earnings: 1050 },
        { month: 'Apr', earnings: 1180 },
        { month: 'May', earnings: 1220 },
        { month: 'Jun', earnings: 1330 },
    ];

    return (
        <div className='container mx-auto px-4 py-8 '>
            {/* Header */}
            <div className='mb-8'>
                <h1 className='mb-2 text-4xl font-bold text-foreground'>
                    Investor Dashboard
                </h1>
                <p className='text-muted-foreground'>
                    Track your investments and earnings
                </p>
            </div>

            {/* Stats Grid */}
            <div className='mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4'>
                <GlassCard className='p-6'>
                    <div className='mb-4 flex items-center justify-between'>
                        <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-cyan-600'>
                            <Wallet className='text-white' size={24} />
                        </div>
                        <span className='text-xs text-muted-foreground'>
                            Total Value
                        </span>
                    </div>
                    <div className='text-3xl font-bold text-foreground'>
                        ${totalPortfolioValue.toLocaleString()}
                    </div>
                    <p className='mt-2 text-sm text-green-500'>
                        <TrendingUp size={14} className='mr-1 inline' />
                        +12.5% this month
                    </p>
                </GlassCard>

                <GlassCard className='p-6'>
                    <div className='mb-4 flex items-center justify-between'>
                        <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600'>
                            <DollarSign className='text-white' size={24} />
                        </div>
                        <span className='text-xs text-muted-foreground'>
                            Monthly Earnings
                        </span>
                    </div>
                    <div className='text-3xl font-bold text-foreground'>
                        ${totalMonthlyEarnings.toLocaleString()}
                    </div>
                    <p className='mt-2 text-sm text-muted-foreground'>
                        Expected this month
                    </p>
                </GlassCard>

                <GlassCard className='p-6'>
                    <div className='mb-4 flex items-center justify-between'>
                        <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-600 to-purple-600'>
                            <Gift className='text-white' size={24} />
                        </div>
                        <span className='text-xs text-muted-foreground'>
                            Total Earned
                        </span>
                    </div>
                    <div className='text-3xl font-bold text-foreground'>
                        ${totalEarned.toLocaleString()}
                    </div>
                    <p className='mt-2 text-sm text-muted-foreground'>
                        All-time returns
                    </p>
                </GlassCard>

                <GlassCard className='p-6'>
                    <div className='mb-4 flex items-center justify-between'>
                        <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600'>
                            <TrendingUp className='text-white' size={24} />
                        </div>
                        <span className='text-xs text-muted-foreground'>
                            Avg APY
                        </span>
                    </div>
                    <div className='bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-3xl font-bold text-transparent'>
                        {avgAPY.toFixed(1)}%
                    </div>
                    <p className='mt-2 text-sm text-muted-foreground'>
                        Portfolio average
                    </p>
                </GlassCard>
            </div>

            {/* Claim Rewards */}
            <GlassCard variant='bordered' className='mt-8 p-6'>
                <div className='flex flex-col justify-between gap-4 md:flex-row md:items-center'>
                    <div>
                        <h3 className='mb-2 text-xl font-bold text-foreground'>
                            Claimable Rewards
                        </h3>
                        <p className='text-muted-foreground'>
                            You have ${totalMonthlyEarnings.toFixed(2)}{' '}
                            available to claim
                        </p>
                    </div>
                    <Button variant='brand' size='lg'>
                        Claim Rewards
                    </Button>
                </div>
            </GlassCard>

            {/* Earnings Chart */}
            <GlassCard className='mt-8 p-8'>
                <h2 className='mb-6 text-2xl font-bold text-foreground'>
                    Earnings History
                </h2>
                <div className='h-80 w-full'>
                    <ResponsiveContainer width='100%' height='100%'>
                        <LineChart data={earningsData}>
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
                                tickFormatter={(value) => `$${value}`}
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
                                dataKey='earnings'
                                stroke='#8B5CF6'
                                strokeWidth={3}
                                dot={{ fill: '#8B5CF6', r: 4 }}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </GlassCard>

            {/* My Investments */}
            <GlassCard className='mt-8 p-8'>
                <div className='mb-6 flex items-center justify-between'>
                    <h2 className='text-2xl font-bold text-foreground'>
                        My Investments
                    </h2>
                    <Button variant='outline' size='sm' asChild>
                        <Link href='/'>
                            Browse More
                            <ArrowRight size={16} className='ml-2' />
                        </Link>
                    </Button>
                </div>

                <div className=''>
                    {mockInvestments.map((investment, idx) => (
                        <div
                            key={investment.id}
                            className={cn(
                                'rounded-2xl border border-border bg-accent/5 p-6 transition-all hover:border-primary/50',
                                idx > 0 && 'mt-4',
                            )}
                        >
                            <div className='flex flex-col justify-between gap-4 md:flex-row md:items-center'>
                                <div className='flex-1'>
                                    <h3 className='mb-2 text-lg font-semibold text-foreground'>
                                        {investment.businessName}
                                    </h3>
                                    <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
                                        <div>
                                            <p className='text-xs text-muted-foreground'>
                                                Tokens Owned
                                            </p>
                                            <p className='font-semibold text-foreground'>
                                                {investment.tokensOwned}
                                            </p>
                                        </div>
                                        <div>
                                            <p className='text-xs text-muted-foreground'>
                                                Value
                                            </p>
                                            <p className='font-semibold text-foreground'>
                                                $
                                                {investment.investmentValue.toLocaleString()}
                                            </p>
                                        </div>
                                        <div>
                                            <p className='text-xs text-muted-foreground'>
                                                Monthly
                                            </p>
                                            <p className='font-semibold text-green-500'>
                                                ${investment.monthlyEarnings}
                                            </p>
                                        </div>
                                        <div>
                                            <p className='text-xs text-muted-foreground'>
                                                Total Earned
                                            </p>
                                            <p className='font-semibold text-green-500'>
                                                $
                                                {investment.totalEarned.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className='text-right'>
                                    <div className='bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-2xl font-bold text-transparent'>
                                        {investment.apy}%
                                    </div>
                                    <p className='text-xs text-muted-foreground'>
                                        APY
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </GlassCard>
        </div>
    );
}
