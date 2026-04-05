'use client'

import { GlassCard } from '@/components/GlassCard'
import { Button } from '@/components/ui/button'
import { getSolanaExplorerTxUrl } from '@/lib/env'
import { CheckCircle2, ExternalLink } from 'lucide-react'
import Link from 'next/link'

type Props = {
    open: boolean
    onClose: () => void
    businessName: string
    tokens: number
    totalSol: number
    signature: string
    /** e.g. "Primary pool" vs "Marketplace listing" */
    variantLabel?: string
}

export function PurchaseSuccessModal({
    open,
    onClose,
    businessName,
    tokens,
    totalSol,
    signature,
    variantLabel,
}: Props) {
    if (!open) return null
    const explorer = getSolanaExplorerTxUrl(signature)

    return (
        <div
            className='fixed inset-0 z-[99999] flex items-center justify-center bg-black/75 p-4 backdrop-blur-lg'
            onClick={onClose}
            role='dialog'
            aria-modal='true'
            aria-labelledby='purchase-success-title'
        >
            <div className='w-full max-w-md' onClick={(e) => e.stopPropagation()}>
                <GlassCard className='border border-primary/20 p-8 text-center shadow-lg shadow-primary/10'>
                    <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/15'>
                        <CheckCircle2
                            className='text-green-500'
                            size={40}
                            strokeWidth={2}
                        />
                    </div>
                    <p className='mb-1 text-xs font-semibold uppercase tracking-wider text-primary'>
                        {variantLabel ?? 'On-chain purchase'}
                    </p>
                    <h2
                        id='purchase-success-title'
                        className='mb-2 text-2xl font-bold text-foreground'
                    >
                        Purchase complete
                    </h2>
                    <p className='mb-6 text-muted-foreground'>
                        You bought{' '}
                        <span className='font-semibold text-foreground'>
                            {tokens.toLocaleString()} token
                            {tokens === 1 ? '' : 's'}
                        </span>{' '}
                        in{' '}
                        <span className='font-semibold text-foreground'>
                            {businessName}
                        </span>
                        .
                    </p>
                    <div className='mb-6 space-y-2 rounded-2xl border border-border bg-accent/30 px-4 py-3 text-left text-sm'>
                        <div className='flex justify-between'>
                            <span className='text-muted-foreground'>Paid</span>
                            <span className='font-mono font-medium text-foreground'>
                                {totalSol.toFixed(6)} SOL
                            </span>
                        </div>
                        <div className='flex justify-between gap-2'>
                            <span className='shrink-0 text-muted-foreground'>
                                Signature
                            </span>
                            <span
                                className='truncate font-mono text-xs text-foreground'
                                title={signature}
                            >
                                {signature.slice(0, 12)}…{signature.slice(-8)}
                            </span>
                        </div>
                    </div>
                    <div className='flex flex-col gap-3 sm:flex-row'>
                        <Button variant='outline' className='flex-1' asChild>
                            <Link href={explorer} target='_blank' rel='noreferrer'>
                                <ExternalLink size={16} className='mr-2' />
                                Explorer
                            </Link>
                        </Button>
                        <Button variant='brand' className='flex-1' onClick={onClose}>
                            Done
                        </Button>
                    </div>
                </GlassCard>
            </div>
        </div>
    )
}
