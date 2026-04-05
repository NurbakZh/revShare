'use client'

import { GlassCard } from '@/components/GlassCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { fetchHealth, registerBusiness } from '@/lib/api/oracle'
import { useAppStore } from '@/lib/store'
import {
    getBusinessPoolPda,
    getTokenMintPda,
    getVaultPda,
} from '@/lib/solana/pda'
import { useRevshareProgram } from '@/lib/solana/useRevshareProgram'
import { BN } from '@coral-xyz/anchor'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { useWallet } from '@solana/wallet-adapter-react'
import {
    PublicKey,
    SystemProgram,
    SYSVAR_RENT_PUBKEY,
} from '@solana/web3.js'
import { ArrowLeft, Building2, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

const LAMPORTS_PER_SOL = 1_000_000_000

export default function CreateBusinessPage() {
    const router = useRouter()
    const { publicKey } = useWallet()
    const program = useRevshareProgram()
    const { setHasBusiness } = useAppStore()
    const [step, setStep] = useState(1)
    const [busy, setBusy] = useState(false)
    const [err, setErr] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        city: '',
        tokenSupply: '',
        tokenPriceSol: '',
        revenueShare: '',
        targetRevenueSol: '',
    })

    const isStep1Valid =
        formData.name && formData.description && formData.city.trim()
    const isStep2Valid =
        formData.tokenSupply &&
        formData.tokenPriceSol &&
        formData.revenueShare &&
        formData.targetRevenueSol

    async function handleSubmit() {
        setErr(null)
        if (!publicKey || !program) {
            setErr('Connect wallet first')
            return
        }
        const totalTokens = parseInt(formData.tokenSupply, 10)
        const tokenPriceLamports = Math.round(
            parseFloat(formData.tokenPriceSol) * LAMPORTS_PER_SOL,
        )
        const raiseLimit = totalTokens * tokenPriceLamports
        const minCollateral = Math.floor((raiseLimit * 30) / 100)
        const collateralAmount = Math.max(
            Math.floor(0.5 * LAMPORTS_PER_SOL),
            minCollateral,
        )
        const targetRevenueLamports = Math.round(
            parseFloat(formData.targetRevenueSol) * LAMPORTS_PER_SOL,
        )
        const revenueShareBps = Math.min(
            5000,
            Math.round(parseFloat(formData.revenueShare) * 100),
        )

        const health = await fetchHealth()
        if (!health.success || !health.data?.oraclePublicKey) {
            setErr(health.error || 'Oracle /health unavailable')
            return
        }

        setBusy(true)
        try {
            const oracleAuthority = new PublicKey(
                health.data.oraclePublicKey,
            )
            const [businessPoolPda] = getBusinessPoolPda(publicKey, 0)
            const [tokenMintPda] = getTokenMintPda(businessPoolPda)
            const [vaultPda] = getVaultPda(businessPoolPda)
            await program.methods
                .initializeBusiness(
                    new BN(0),
                    new BN(totalTokens),
                    new BN(tokenPriceLamports),
                    revenueShareBps,
                    new BN(collateralAmount),
                    new BN(raiseLimit),
                    new BN(targetRevenueLamports),
                    oracleAuthority,
                )
                .accounts({
                    owner: publicKey,
                    businessPool: businessPoolPda,
                    tokenMint: tokenMintPda,
                    vault: vaultPda,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: SystemProgram.programId,
                    rent: SYSVAR_RENT_PUBKEY,
                })
                .rpc()

            const reg = await registerBusiness({
                pubkey: businessPoolPda.toBase58(),
                ownerPubkey: publicKey.toBase58(),
                name: formData.name,
                description: formData.description,
                city: formData.city.trim(),
                raiseLimit,
                targetRevenue: targetRevenueLamports,
            })
            if (!reg.success) {
                setErr(reg.error || 'Register failed after deploy')
            } else {
                setHasBusiness(true)
                router.push(`/business/${businessPoolPda.toBase58()}`)
            }
        } catch (e) {
            setErr(e instanceof Error ? e.message : 'Transaction failed')
        } finally {
            setBusy(false)
        }
    }

    const supply = parseInt(formData.tokenSupply, 10) || 0
    const priceSol = parseFloat(formData.tokenPriceSol) || 0

    return (
        <div className='container mx-auto max-w-3xl px-4  py-8'>
            <button
                onClick={() => router.push('/profile')}
                className='flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground'
            >
                <ArrowLeft size={20} />
                Back to Profile
            </button>

            <div className='mt-8 text-center'>
                <div className='mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-cyan-600 shadow-lg shadow-purple-500/20'>
                    <Building2 className='text-white' size={36} />
                </div>
                <h1 className='mb-2 text-4xl font-bold text-foreground'>
                    Create business pool
                </h1>
                <p className='text-muted-foreground'>
                    On-chain pool + Oracle register
                </p>
            </div>

            <div className='mt-8 flex items-center justify-center gap-4'>
                <div className='flex items-center gap-2'>
                    <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                            step >= 1
                                ? 'bg-gradient-to-br from-purple-600 to-cyan-600 text-white shadow-md shadow-purple-500/20'
                                : 'bg-accent/50 text-muted-foreground'
                        }`}
                    >
                        {step > 1 ? <Check size={20} /> : '1'}
                    </div>
                    <span
                        className={`text-sm font-medium ${step >= 1 ? 'text-foreground' : 'text-muted-foreground'}`}
                    >
                        Business info
                    </span>
                </div>
                <div className='h-0.5 w-16 bg-border' />
                <div className='flex items-center gap-2'>
                    <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                            step >= 2
                                ? 'bg-gradient-to-br from-purple-600 to-cyan-600 text-white shadow-md shadow-purple-500/20'
                                : 'bg-accent/50 text-muted-foreground'
                        }`}
                    >
                        {step > 2 ? <Check size={20} /> : '2'}
                    </div>
                    <span
                        className={`text-sm font-medium ${step >= 2 ? 'text-foreground' : 'text-muted-foreground'}`}
                    >
                        Token details
                    </span>
                </div>
            </div>

            {err && (
                <p className='mt-4 text-center text-sm text-red-500'>{err}</p>
            )}

            <GlassCard className='mt-8 p-8'>
                {step === 1 && (
                    <div>
                        <h2 className='mb-6 text-2xl font-bold text-foreground'>
                            Business information
                        </h2>
                        <div className='mt-6'>
                            <Label htmlFor='business-name' required>
                                Name
                            </Label>
                            <Input
                                id='business-name'
                                placeholder='e.g., Brew & Bytes Café'
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        name: e.target.value,
                                    })
                                }
                            />
                        </div>
                        <div className='mt-6'>
                            <Label htmlFor='business-description' required>
                                Description
                            </Label>
                            <Textarea
                                id='business-description'
                                placeholder='What you do…'
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        description: e.target.value,
                                    })
                                }
                                rows={4}
                            />
                        </div>
                        <div className='mt-6'>
                            <Label htmlFor='business-city' required>
                                City
                            </Label>
                            <Input
                                id='business-city'
                                placeholder='e.g., Astana'
                                value={formData.city}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        city: e.target.value,
                                    })
                                }
                            />
                        </div>
                        <div className='mt-8 flex justify-end'>
                            <Button
                                variant='brand'
                                size='lg'
                                onClick={() => setStep(2)}
                                disabled={!isStep1Valid}
                            >
                                Continue
                            </Button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className='space-y-6'>
                        <h2 className='mb-6 text-2xl font-bold text-foreground'>
                            Token configuration (SOL)
                        </h2>
                        <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                            <div>
                                <Label htmlFor='token-supply' required>
                                    Total token supply
                                </Label>
                                <Input
                                    id='token-supply'
                                    type='number'
                                    placeholder='1000'
                                    value={formData.tokenSupply}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            tokenSupply: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div>
                                <Label htmlFor='token-price' required>
                                    Token price (SOL)
                                </Label>
                                <Input
                                    id='token-price'
                                    type='number'
                                    step='0.000001'
                                    placeholder='0.001'
                                    value={formData.tokenPriceSol}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            tokenPriceSol: e.target.value,
                                        })
                                    }
                                />
                            </div>
                        </div>
                        <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                            <div>
                                <Label
                                    htmlFor='revenue-share'
                                    required
                                    hint='(max 50%)'
                                >
                                    Revenue share (%)
                                </Label>
                                <Input
                                    id='revenue-share'
                                    type='number'
                                    placeholder='10'
                                    min='1'
                                    max='50'
                                    value={formData.revenueShare}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            revenueShare: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div>
                                <Label htmlFor='target-revenue' required>
                                    Target monthly revenue (SOL)
                                </Label>
                                <Input
                                    id='target-revenue'
                                    type='number'
                                    step='0.01'
                                    placeholder='2'
                                    value={formData.targetRevenueSol}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            targetRevenueSol: e.target.value,
                                        })
                                    }
                                />
                            </div>
                        </div>

                        {supply > 0 && priceSol > 0 && (
                            <GlassCard variant='bordered' className='bg-primary/5 p-6'>
                                <h3 className='mb-4 font-semibold text-foreground'>
                                    Raise cap
                                </h3>
                                <p className='text-muted-foreground'>
                                    {(supply * priceSol).toFixed(6)} SOL (
                                    supply × price)
                                </p>
                                <p className='mt-2 text-xs text-muted-foreground'>
                                    Collateral: max(0.5 SOL, 30% of cap)
                                </p>
                            </GlassCard>
                        )}

                        <div className='flex gap-4'>
                            <Button
                                variant='outline'
                                size='lg'
                                className='flex-1'
                                onClick={() => setStep(1)}
                            >
                                Back
                            </Button>
                            <Button
                                variant='brand'
                                size='lg'
                                className='flex-1'
                                disabled={
                                    !isStep2Valid ||
                                    !publicKey ||
                                    !program ||
                                    busy
                                }
                                onClick={handleSubmit}
                            >
                                {busy ? 'Signing…' : 'Deploy pool'}
                            </Button>
                        </div>
                    </div>
                )}
            </GlassCard>
        </div>
    )
}
