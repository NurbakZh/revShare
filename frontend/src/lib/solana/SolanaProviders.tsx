'use client'

import { getSolanaRpcUrl } from '@/lib/env'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import {
    ConnectionProvider,
    WalletProvider,
} from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom'
import { Buffer } from 'buffer'
import React, { useEffect, useMemo } from 'react'

import '@solana/wallet-adapter-react-ui/styles.css'

const CP = ConnectionProvider as React.FC<
    React.PropsWithChildren<{ endpoint: string }>
>
const WP = WalletProvider as React.FC<
    React.PropsWithChildren<{
        wallets: readonly unknown[]
        autoConnect?: boolean
    }>
>
const WMP = WalletModalProvider as React.FC<React.PropsWithChildren>

export function SolanaProviders({ children }: { children: React.ReactNode }) {
    const endpoint = useMemo(() => getSolanaRpcUrl(), [])
    const wallets = useMemo(
        () => [new PhantomWalletAdapter({ network: WalletAdapterNetwork.Devnet })],
        [],
    )

    useEffect(() => {
        if (typeof globalThis !== 'undefined' && !globalThis.Buffer) {
            globalThis.Buffer = Buffer
        }
    }, [])

    return (
        <CP endpoint={endpoint}>
            <WP wallets={wallets} autoConnect>
                <WMP>{children}</WMP>
            </WP>
        </CP>
    )
}
