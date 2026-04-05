'use client'

import * as anchor from '@coral-xyz/anchor'
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react'
import { useMemo } from 'react'

import { createRevshareProgram } from '@/lib/solana/helpers'

export function useRevshareProgram() {
    const { connection } = useConnection()
    const wallet = useAnchorWallet()

    return useMemo(() => {
        if (!wallet) return null
        const provider = new anchor.AnchorProvider(connection, wallet, {
            commitment: 'confirmed',
        })
        return createRevshareProgram(provider)
    }, [connection, wallet])
}
