'use client';

import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/store';
import { Building2, Plus, User, Wallet } from 'lucide-react';
import React from 'react';

export default function ProfilePage() {
    const { isConnected, hasBusiness, setHasBusiness, setIsConnected } =
        useAppStore();

    if (!isConnected) {
        return (
            <div className='container mx-auto px-4 py-20 text-center'>
                <GlassCard className='mx-auto max-w-md p-8'>
                    <Wallet
                        size={48}
                        className='mx-auto mb-4 text-muted-foreground'
                    />
                    <h1 className='mb-4 text-2xl font-bold'>
                        Connect your wallet
                    </h1>
                    <p className='mb-6 text-muted-foreground'>
                        You need to connect your wallet to view your profile.
                    </p>
                    <Button
                        variant='brand'
                        onClick={() => setIsConnected(true)}
                        className='w-full'
                    >
                        Connect Wallet
                    </Button>
                </GlassCard>
            </div>
        );
    }

    return (
        <div className='container mx-auto px-4 py-8 '>
            <div className='mb-8 flex items-center justify-between'>
                <h1 className='text-4xl font-bold text-foreground'>
                    My Profile
                </h1>
                <Button variant='outline' onClick={() => setIsConnected(false)}>
                    Disconnect
                </Button>
            </div>

            <div className='mb-8 grid grid-cols-1 gap-8 lg:grid-cols-3'>
                <GlassCard className='h-fit p-8 lg:col-span-1'>
                    <div className='text-center'>
                        <div className='mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-3xl font-bold text-white'>
                            UN
                        </div>
                        <h2 className='text-xl font-bold text-foreground'>
                            User Name
                        </h2>
                        <p className='mt-1 font-mono text-sm text-muted-foreground'>
                            0x71C...39A4
                        </p>
                    </div>

                    <div className='mt-8 space-y-4'>
                        <div className='flex items-center justify-between rounded-xl border border-border bg-accent/50 p-3'>
                            <span className='text-sm text-muted-foreground'>
                                Status
                            </span>
                            <span className='text-sm font-semibold text-green-500'>
                                Verified
                            </span>
                        </div>
                        <div className='flex items-center justify-between rounded-xl border border-border bg-accent/50 p-3'>
                            <span className='text-sm text-muted-foreground'>
                                Member Since
                            </span>
                            <span className='text-sm font-semibold'>
                                April 2024
                            </span>
                        </div>
                    </div>
                </GlassCard>

                <div className='space-y-8 lg:col-span-2'>
                    <GlassCard className='mb-8 p-8'>
                        <div className='mb-6 flex items-center justify-between'>
                            <h2 className='text-2xl font-bold text-foreground'>
                                Business Account
                            </h2>
                            {hasBusiness ? (
                                <span className='rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-green-500'>
                                    Active
                                </span>
                            ) : (
                                <span className='rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-yellow-500'>
                                    Not Created
                                </span>
                            )}
                        </div>

                        {hasBusiness ? (
                            <div className='space-y-4'>
                                <p className='text-muted-foreground'>
                                    You have a business account. You can now
                                    toggle between Investor and Business modes
                                    in the navigation bar.
                                </p>
                                <div className='rounded-2xl border border-border bg-accent/20 p-6'>
                                    <div className='flex items-center gap-4'>
                                        <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20'>
                                            <Building2
                                                className='text-primary'
                                                size={24}
                                            />
                                        </div>
                                        <div>
                                            <h3 className='font-bold'>
                                                Brew & Bytes Café
                                            </h3>
                                            <p className='text-sm text-muted-foreground'>
                                                ID: 4829-XJ-192
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    variant='outline'
                                    onClick={() => setHasBusiness(false)}
                                >
                                    Delete Business Association (Demo)
                                </Button>
                            </div>
                        ) : (
                            <div className='py-12 text-center'>
                                <Building2
                                    size={48}
                                    className='mx-auto mb-4 text-muted-foreground/30'
                                />
                                <h3 className='mb-2 text-xl font-bold'>
                                    Grow your business with revShare
                                </h3>
                                <p className='mx-auto mb-8 max-w-sm text-muted-foreground'>
                                    Tokenize your revenue stream and get access
                                    to community capital.
                                </p>
                                <Button
                                    variant='brand'
                                    onClick={() => setHasBusiness(true)}
                                    className='gap-2'
                                >
                                    <Plus size={20} />
                                    Create Business Profile
                                </Button>
                            </div>
                        )}
                    </GlassCard>

                    <GlassCard className='mt-8 p-8'>
                        <h2 className='mb-6 text-2xl font-bold text-foreground'>
                            Investment Overview
                        </h2>
                        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                            <div className='rounded-2xl border border-border bg-accent/30 p-4'>
                                <p className='mb-1 text-sm text-muted-foreground'>
                                    Total Invested
                                </p>
                                <p className='text-2xl font-bold'>$12,450.00</p>
                            </div>
                            <div className='rounded-2xl border border-border bg-accent/30 p-4'>
                                <p className='mb-1 text-sm text-muted-foreground'>
                                    Total Earned
                                </p>
                                <p className='text-2xl font-bold text-green-500'>
                                    +$2,140.23
                                </p>
                            </div>
                        </div>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
}
