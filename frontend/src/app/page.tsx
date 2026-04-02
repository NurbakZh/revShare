'use client';

import { BusinessCard } from '@/components/BusinessCard';
import { GlassCard } from '@/components/GlassCard';
import { mockBusinesses } from '@/lib/data';
import { DollarSign, Filter, Search, Shield, TrendingUp } from 'lucide-react';
import React, { useState } from 'react';

export default function Home() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedRisk, setSelectedRisk] = useState('All');
    const [sortBy, setSortBy] = useState('apy');

    const categories = [
        'All',
        'Food & Beverage',
        'Technology',
        'Health & Wellness',
        'Pet Services',
        'Food & Delivery',
    ];
    const riskLevels = ['All', 'Low', 'Medium', 'High'];

    const filteredBusinesses = mockBusinesses
        .filter((b) => {
            const matchesSearch =
                b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                b.description.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory =
                selectedCategory === 'All' || b.category === selectedCategory;
            const matchesRisk =
                selectedRisk === 'All' || b.riskLevel === selectedRisk;
            return matchesSearch && matchesCategory && matchesRisk;
        })
        .sort((a, b) => {
            if (sortBy === 'apy') return b.apy - a.apy;
            if (sortBy === 'funding')
                return b.fundingProgress - a.fundingProgress;
            if (sortBy === 'price') return a.tokenPrice - b.tokenPrice;
            return 0;
        });

    return (
        <div className='container mx-auto space-y-8 px-4 py-8'>
            {/* Hero Section */}
            <div className='space-y-4 py-8 text-center'>
                <h1 className='bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 bg-clip-text text-5xl font-bold text-transparent md:text-6xl'>
                    Invest in Real Businesses
                </h1>
                <p className='mx-auto max-w-2xl text-xl text-muted-foreground'>
                    Buy revenue-sharing tokens from verified small businesses.
                    Earn monthly dividends on Solana.
                </p>
            </div>

            {/* Stats */}
            <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
                <GlassCard className='p-6'>
                    <div className='flex items-center gap-4'>
                        <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-cyan-600'>
                            <DollarSign className='text-white' size={24} />
                        </div>
                        <div>
                            <div className='text-2xl font-bold text-foreground'>
                                $2.4M
                            </div>
                            <p className='text-sm text-muted-foreground'>
                                Total Invested
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
                                18.5%
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
                                42
                            </div>
                            <p className='text-sm text-muted-foreground'>
                                Active Businesses
                            </p>
                        </div>
                    </div>
                </GlassCard>
            </div>

            {/* Search and Filters */}
            <GlassCard className='p-6'>
                <div className='grid grid-cols-1 gap-4 md:grid-cols-12'>
                    {/* Search */}
                    <div className='relative md:col-span-5'>
                        <Search
                            className='absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground'
                            size={20}
                        />
                        <input
                            type='text'
                            placeholder='Search businesses...'
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className='w-full rounded-2xl border border-border bg-accent/50 py-3 pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50'
                        />
                    </div>

                    {/* Category Filter */}
                    <div className='md:col-span-3'>
                        <select
                            value={selectedCategory}
                            onChange={(e) =>
                                setSelectedCategory(e.target.value)
                            }
                            className='w-full rounded-2xl border border-border bg-accent/50 px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50'
                        >
                            {categories.map((cat) => (
                                <option
                                    key={cat}
                                    value={cat}
                                    className='bg-background text-foreground'
                                >
                                    {cat}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Risk Filter */}
                    <div className='md:col-span-2'>
                        <select
                            value={selectedRisk}
                            onChange={(e) => setSelectedRisk(e.target.value)}
                            className='w-full rounded-2xl border border-border bg-accent/50 px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50'
                        >
                            {riskLevels.map((risk) => (
                                <option
                                    key={risk}
                                    value={risk}
                                    className='bg-background text-foreground'
                                >
                                    {risk} Risk
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Sort */}
                    <div className='md:col-span-2'>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className='w-full rounded-2xl border border-border bg-accent/50 px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50'
                        >
                            <option
                                value='apy'
                                className='bg-background text-foreground'
                            >
                                Highest APY
                            </option>
                            <option
                                value='funding'
                                className='bg-background text-foreground'
                            >
                                Funding %
                            </option>
                            <option
                                value='price'
                                className='bg-background text-foreground'
                            >
                                Price: Low to High
                            </option>
                        </select>
                    </div>
                </div>
            </GlassCard>

            {/* Business Grid */}
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
                {filteredBusinesses.map((business) => (
                    <BusinessCard key={business.id} business={business} />
                ))}
            </div>

            {filteredBusinesses.length === 0 && (
                <div className='py-16 text-center'>
                    <Filter
                        size={48}
                        className='mx-auto mb-4 text-muted-foreground'
                    />
                    <p className='text-xl text-muted-foreground'>
                        No businesses found
                    </p>
                    <p className='text-muted-foreground/60'>
                        Try adjusting your filters
                    </p>
                </div>
            )}
        </div>
    );
}
