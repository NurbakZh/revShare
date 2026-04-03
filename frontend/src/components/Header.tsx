'use client';

import { HeaderNav } from '@/components/HeaderNav';
import { RoleToggle } from '@/components/RoleToggle';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAppStore } from '@/lib/store';
import Link from 'next/link';
import React from 'react';

export function Header() {
    const { isConnected, hasBusiness, setIsConnected } = useAppStore();

    return (
        <nav className='sticky top-0 z-[100] border-b border-border bg-background/80 p-4 backdrop-blur-md'>
            <div className='container mx-auto flex items-center justify-between'>
                <Link
                    href='/'
                    className='cursor-pointer bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-2xl font-bold text-transparent'
                >
                    revShare
                </Link>
                <div className='flex items-center gap-6'>
                    <HeaderNav />
                    <div className='mx-2 h-8 w-[1px] bg-border' />
                    {isConnected && hasBusiness && <RoleToggle />}
                    <ThemeToggle />
                    {isConnected ? (
                        <Link
                            href='/profile'
                            className='flex items-center gap-2 rounded-xl bg-accent px-5 py-2 text-sm font-medium transition-all hover:bg-accent/80'
                        >
                            <div className='h-6 w-6 rounded-full bg-gradient-to-r from-purple-600 to-blue-600' />
                            Profile
                        </Link>
                    ) : (
                        <button
                            onClick={() => setIsConnected(true)}
                            className='rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-5 py-2 text-sm font-medium text-white transition-all hover:shadow-lg hover:shadow-purple-500/30 active:scale-95'
                        >
                            Connect Wallet
                        </button>
                    )}
                </div>
            </div>
        </nav>
    );
}
