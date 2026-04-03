'use client';

import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DollarSign, TrendingUp, Unlock, Users, Zap } from 'lucide-react';
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

export default function BusinessDashboard() {
    const [showSimulateModal, setShowSimulateModal] = useState(false);

    // Mock business data
    const businessData = {
        name: 'Brew & Bytes Café',
        totalRaised: 329000,
        targetFunding: 500000,
        currentRevenue: 82000,
        targetRevenue: 100000,
        tokenHolders: 132,
        totalTokens: 10000,
        soldTokens: 6580,
        revenueSharePercent: 20,
    };

    const unlockMilestones = [
        {
            percentage: 40,
            amount: 200000,
            unlocked: true,
            label: 'Expansion Fund',
        },
        {
            percentage: 70,
            amount: 350000,
            unlocked: false,
            label: 'Equipment Upgrade',
        },
        {
            percentage: 100,
            amount: 500000,
            unlocked: false,
            label: 'Full Capital',
        },
    ];

    const revenueData = [
        { month: 'Jan', revenue: 45 },
        { month: 'Feb', revenue: 48 },
        { month: 'Mar', revenue: 52 },
        { month: 'Apr', revenue: 55 },
        { month: 'May', revenue: 58 },
        { month: 'Jun', revenue: 62 },
        { month: 'Jul', revenue: 65 },
        { month: 'Aug', revenue: 68 },
        { month: 'Sep', revenue: 71 },
        { month: 'Oct', revenue: 74 },
        { month: 'Nov', revenue: 78 },
        { month: 'Dec', revenue: 82 },
    ];

    const fundingProgress =
        (businessData.totalRaised / businessData.targetFunding) * 100;
    const revenueProgress =
        (businessData.currentRevenue / businessData.targetRevenue) * 100;

    return (
        <div className='container mx-auto px-4 py-8 '>
            {/* Header */}
            <div className='flex flex-col justify-between gap-4 md:flex-row md:items-center'>
                <div>
                    <h1 className='mb-2 text-4xl font-bold text-foreground'>
                        Business Dashboard
                    </h1>
                    <p className='text-muted-foreground'>
                        {businessData.name} - Performance Overview
                    </p>
                </div>
                <Button
                    variant='brand'
                    size='lg'
                    onClick={() => setShowSimulateModal(true)}
                >
                    <Zap size={20} className='mr-2' />
                    Simulate Revenue
                </Button>
            </div>

            {/* Stats Grid */}
            <div className='mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4'>
                <GlassCard className='p-6'>
                    <div className='mb-4 flex items-center justify-between'>
                        <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-cyan-600'>
                            <DollarSign className='text-white' size={24} />
                        </div>
                        <span className='text-xs text-muted-foreground'>
                            Funds Raised
                        </span>
                    </div>
                    <div className='text-3xl font-bold text-foreground'>
                        ${businessData.totalRaised.toLocaleString()}
                    </div>
                    <p className='mt-2 text-sm text-muted-foreground'>
                        of ${businessData.targetFunding.toLocaleString()} target
                    </p>
                </GlassCard>

                <GlassCard className='p-6'>
                    <div className='mb-4 flex items-center justify-between'>
                        <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600'>
                            <TrendingUp className='text-white' size={24} />
                        </div>
                        <span className='text-xs text-muted-foreground'>
                            Monthly Revenue
                        </span>
                    </div>
                    <div className='text-3xl font-bold text-foreground'>
                        ${businessData.currentRevenue.toLocaleString()}
                    </div>
                    <p className='mt-2 text-sm text-green-500'>
                        <TrendingUp size={14} className='mr-1 inline' />
                        +5.1% from last month
                    </p>
                </GlassCard>

                <GlassCard className='p-6'>
                    <div className='mb-4 flex items-center justify-between'>
                        <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-600 to-purple-600'>
                            <Users className='text-white' size={24} />
                        </div>
                        <span className='text-xs text-muted-foreground'>
                            Token Holders
                        </span>
                    </div>
                    <div className='text-3xl font-bold text-foreground'>
                        {businessData.tokenHolders}
                    </div>
                    <p className='mt-2 text-sm text-muted-foreground'>
                        Active investors
                    </p>
                </GlassCard>

                <GlassCard className='p-6'>
                    <div className='mb-4 flex items-center justify-between'>
                        <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600'>
                            <Unlock className='text-white' size={24} />
                        </div>
                        <span className='text-xs text-muted-foreground'>
                            Unlocked
                        </span>
                    </div>
                    <div className='bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-3xl font-bold text-transparent'>
                        $200K
                    </div>
                    <p className='mt-2 text-sm text-muted-foreground'>
                        Available now
                    </p>
                </GlassCard>
            </div>

            {/* Funding Progress */}
            <GlassCard className='mt-8 p-8'>
                <h2 className='mb-6 text-2xl font-bold text-foreground'>
                    Funding Progress
                </h2>
                <div className=''>
                    <div>
                        <div className='mb-2 flex justify-between text-sm text-muted-foreground'>
                            <span>Total Raised</span>
                            <span>{fundingProgress.toFixed(1)}%</span>
                        </div>
                        <div className='h-4 overflow-hidden rounded-full bg-accent/20'>
                            <div
                                className='h-full rounded-full bg-gradient-to-r from-purple-600 to-cyan-600 transition-all duration-500'
                                style={{ width: `${fundingProgress}%` }}
                            />
                        </div>
                        <p className='mt-2 text-sm text-muted-foreground/60'>
                            {businessData.soldTokens.toLocaleString()} /{' '}
                            {businessData.totalTokens.toLocaleString()} tokens
                            sold
                        </p>
                    </div>
                </div>
            </GlassCard>

            {/* Unlock Milestones */}
            <GlassCard className='mt-8 p-8'>
                <h2 className='mb-6 text-2xl font-bold text-foreground'>
                    Fund Release Milestones
                </h2>
                <div className=''>
                    {unlockMilestones.map((milestone, index) => (
                        <div
                            key={index}
                            className={`rounded-2xl border p-6 transition-all ${index > 0 ? 'mt-6' : ''} ${
                                milestone.unlocked
                                    ? 'border-primary/30 bg-primary/10'
                                    : 'border-border bg-accent/5'
                            }`}
                        >
                            <div className='flex flex-col justify-between gap-4 md:flex-row md:items-center'>
                                <div className='flex items-center gap-4'>
                                    <div
                                        className={`flex h-16 w-16 items-center justify-center rounded-2xl ${
                                            milestone.unlocked
                                                ? 'bg-gradient-to-br from-green-600 to-emerald-600'
                                                : 'bg-gradient-to-br from-gray-600 to-gray-700'
                                        }`}
                                    >
                                        {milestone.unlocked ? (
                                            <Unlock
                                                className='text-white'
                                                size={28}
                                            />
                                        ) : (
                                            <span className='text-xl font-bold text-white'>
                                                {milestone.percentage}%
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className='text-lg font-semibold text-foreground'>
                                            {milestone.label}
                                        </h3>
                                        <p className='text-muted-foreground'>
                                            ${milestone.amount.toLocaleString()}{' '}
                                            at {milestone.percentage}% funding
                                        </p>
                                    </div>
                                </div>
                                {milestone.unlocked ? (
                                    <Button variant='outline' size='sm'>
                                        Request Release
                                    </Button>
                                ) : (
                                    <span className='rounded-xl bg-accent/20 px-4 py-2 text-sm text-muted-foreground'>
                                        Locked
                                    </span>
                                )}
                            </div>
                            {!milestone.unlocked && (
                                <div className='mt-4'>
                                    <div className='h-2 overflow-hidden rounded-full bg-accent/20'>
                                        <div
                                            className='h-full rounded-full bg-gradient-to-r from-purple-600 to-cyan-600'
                                            style={{
                                                width: `${Math.min((fundingProgress / milestone.percentage) * 100, 100)}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </GlassCard>

            {/* Revenue Chart */}
            <GlassCard className='mt-8 p-8'>
                <h2 className='mb-6 text-2xl font-bold text-foreground'>
                    Revenue Trend
                </h2>
                <div className='h-80 w-full'>
                    <ResponsiveContainer width='100%' height='100%'>
                        <LineChart data={revenueData}>
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

            {/* KPI Metrics */}
            <GlassCard className='mt-8 p-8'>
                <h2 className='mb-6 text-2xl font-bold text-foreground'>
                    Key Performance Indicators
                </h2>
                <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
                    <div className='rounded-2xl border border-border bg-accent/5 p-6'>
                        <h3 className='mb-2 text-sm text-muted-foreground'>
                            Revenue Target
                        </h3>
                        <div className='mb-2 text-2xl font-bold text-foreground'>
                            {revenueProgress.toFixed(0)}%
                        </div>
                        <div className='h-2 overflow-hidden rounded-full bg-accent/20'>
                            <div
                                className='h-full rounded-full bg-gradient-to-r from-purple-600 to-cyan-600'
                                style={{ width: `${revenueProgress}%` }}
                            />
                        </div>
                    </div>

                    <div className='rounded-2xl border border-border bg-accent/5 p-6'>
                        <h3 className='mb-2 text-sm text-muted-foreground'>
                            Monthly Distribution
                        </h3>
                        <div className='mb-2 text-2xl font-bold text-green-500'>
                            $
                            {(
                                businessData.currentRevenue *
                                (businessData.revenueSharePercent / 100)
                            ).toLocaleString()}
                        </div>
                        <p className='text-xs text-muted-foreground/60'>
                            {businessData.revenueSharePercent}% of $
                            {businessData.currentRevenue.toLocaleString()}
                        </p>
                    </div>

                    <div className='rounded-2xl border border-border bg-accent/5 p-6'>
                        <h3 className='mb-2 text-sm text-muted-foreground'>
                            Growth Rate
                        </h3>
                        <div className='mb-2 text-2xl font-bold text-green-500'>
                            +5.1%
                        </div>
                        <p className='text-xs text-muted-foreground/60'>
                            Month over month
                        </p>
                    </div>
                </div>
            </GlassCard>

            {/* Simulate Modal */}
            {showSimulateModal && (
                <div
                    className='m-0! fixed bottom-0 left-0 right-0 top-0 z-[99999] flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-lg duration-300 animate-in fade-in'
                    onClick={() => setShowSimulateModal(false)}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className='w-full max-w-md'
                    >
                        <GlassCard className='p-8'>
                            <h2 className='mb-4 text-2xl font-bold text-foreground'>
                                Simulate Revenue Update
                            </h2>
                            <p className='mb-6 text-muted-foreground'>
                                This demo feature simulates submitting a revenue
                                update to the blockchain.
                            </p>
                            <div className='mb-6 space-y-4'>
                                <div>
                                    <label className='mb-2 block text-sm font-medium text-muted-foreground'>
                                        Current Month Revenue
                                    </label>
                                    <Input
                                        type='text'
                                        value='$82,000'
                                        readOnly
                                    />
                                </div>
                                <div>
                                    <label className='mb-2 block text-sm font-medium text-muted-foreground'>
                                        Distribution Amount (20%)
                                    </label>
                                    <Input
                                        type='text'
                                        value='$16,400'
                                        readOnly
                                        className='text-green-500'
                                    />
                                </div>
                            </div>
                            <div className='flex gap-3'>
                                <Button
                                    variant='outline'
                                    className='flex-1'
                                    onClick={() => setShowSimulateModal(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant='brand'
                                    className='flex-1 bg-gradient-to-r from-purple-600 to-cyan-600 transition-all hover:shadow-lg hover:shadow-purple-500/30 active:scale-95'
                                    onClick={() => setShowSimulateModal(false)}
                                >
                                    Submit
                                </Button>
                            </div>
                        </GlassCard>
                    </div>
                </div>
            )}
        </div>
    );
}
