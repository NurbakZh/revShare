'use client';

import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Building2, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

export default function CreateBusinessPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: '',
        tokenSupply: '',
        tokenPrice: '',
        revenueShare: '',
        targetRevenue: '',
    });

    const categories = [
        'Food & Beverage',
        'Technology',
        'Health & Wellness',
        'Retail',
        'Services',
        'Entertainment',
        'Other',
    ];

    const handleSubmit = () => {
        router.push('/business');
    };

    const isStep1Valid =
        formData.name && formData.description && formData.category;
    const isStep2Valid =
        formData.tokenSupply &&
        formData.tokenPrice &&
        formData.revenueShare &&
        formData.targetRevenue;

    return (
        <div className='container mx-auto max-w-3xl px-4  py-8'>
            {/* Back Button */}
            <button
                onClick={() => router.push('/profile')}
                className='flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground'
            >
                <ArrowLeft size={20} />
                Back to Profile
            </button>

            {/* Header */}
            <div className='mt-8 text-center'>
                <div className='mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-cyan-600 shadow-lg shadow-purple-500/20'>
                    <Building2 className='text-white' size={36} />
                </div>
                <h1 className='mb-2 text-4xl font-bold text-foreground'>
                    Create Business Account
                </h1>
                <p className='text-muted-foreground'>
                    Register your business to raise funds on RevShare
                </p>
            </div>

            {/* Progress Steps */}
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
                        Business Info
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
                        Token Details
                    </span>
                </div>
            </div>

            {/* Form */}
            <GlassCard className='mt-8 p-8'>
                {step === 1 && (
                    <div>
                        <h2 className='mb-6 text-2xl font-bold text-foreground'>
                            Business Information
                        </h2>

                        <div className='mt-6'>
                            <label className='mb-2 block text-sm font-medium text-muted-foreground'>
                                Business Name *
                            </label>
                            <Input
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
                            <label className='mb-2 block text-sm font-medium text-muted-foreground'>
                                Description *
                            </label>
                            <textarea
                                placeholder='Describe your business, what you do, and your vision...'
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        description: e.target.value,
                                    })
                                }
                                rows={4}
                                className='w-full resize-none rounded-2xl border border-input bg-background px-4 py-3 text-foreground transition-all placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 dark:bg-accent/20'
                            />
                        </div>

                        <div className='mt-6'>
                            <label className='mb-2 block text-sm font-medium text-muted-foreground'>
                                Category *
                            </label>
                            <Select
                                value={formData.category}
                                onValueChange={(v: string) =>
                                    setFormData({ ...formData, category: v })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder='Select a category' />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat} value={cat}>
                                            {cat}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className='mt-8 flex justify-end'>
                            <Button
                                variant='brand'
                                size='lg'
                                onClick={() => setStep(2)}
                                disabled={!isStep1Valid}
                            >
                                Continue to Token Details
                            </Button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className='space-y-6'>
                        <h2 className='mb-6 text-2xl font-bold text-foreground'>
                            Token Configuration
                        </h2>

                        <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                            <div>
                                <label className='mb-2 block text-sm font-medium text-muted-foreground'>
                                    Total Token Supply *
                                </label>
                                <Input
                                    type='number'
                                    placeholder='e.g., 10000'
                                    value={formData.tokenSupply}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            tokenSupply: e.target.value,
                                        })
                                    }
                                />
                                <p className='mt-1 text-xs text-muted-foreground/60'>
                                    Number of tokens to create
                                </p>
                            </div>

                            <div>
                                <label className='mb-2 block text-sm font-medium text-muted-foreground'>
                                    Token Price ($) *
                                </label>
                                <Input
                                    type='number'
                                    placeholder='e.g., 50'
                                    value={formData.tokenPrice}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            tokenPrice: e.target.value,
                                        })
                                    }
                                />
                                <p className='mt-1 text-xs text-muted-foreground/60'>
                                    Price per token in USD
                                </p>
                            </div>
                        </div>

                        <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                            <div>
                                <label className='mb-2 block text-sm font-medium text-muted-foreground'>
                                    Revenue Share (%) *
                                </label>
                                <Input
                                    type='number'
                                    placeholder='e.g., 20'
                                    min='1'
                                    max='100'
                                    value={formData.revenueShare}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            revenueShare: e.target.value,
                                        })
                                    }
                                />
                                <p className='mt-1 text-xs text-muted-foreground/60'>
                                    % of revenue shared with token holders
                                </p>
                            </div>

                            <div>
                                <label className='mb-2 block text-sm font-medium text-muted-foreground'>
                                    Target Monthly Revenue ($) *
                                </label>
                                <Input
                                    type='number'
                                    placeholder='e.g., 100000'
                                    value={formData.targetRevenue}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            targetRevenue: e.target.value,
                                        })
                                    }
                                />
                                <p className='mt-1 text-xs text-muted-foreground/60'>
                                    Revenue goal for milestone unlocks
                                </p>
                            </div>
                        </div>

                        {formData.tokenSupply && formData.tokenPrice && (
                            <GlassCard
                                variant='bordered'
                                className='bg-primary/5 p-6'
                            >
                                <h3 className='mb-4 font-semibold text-foreground'>
                                    Funding Summary
                                </h3>
                                <div className='space-y-3'>
                                    <div className='flex justify-between'>
                                        <span className='text-muted-foreground'>
                                            Total Tokens
                                        </span>
                                        <span className='font-semibold text-foreground'>
                                            {parseInt(
                                                formData.tokenSupply,
                                            ).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className='flex justify-between'>
                                        <span className='text-muted-foreground'>
                                            Token Price
                                        </span>
                                        <span className='font-semibold text-foreground'>
                                            $
                                            {parseInt(
                                                formData.tokenPrice,
                                            ).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className='border-t border-border pt-3'>
                                        <div className='flex justify-between'>
                                            <span className='font-semibold text-foreground'>
                                                Total Funding Target
                                            </span>
                                            <span className='font-bold text-primary'>
                                                $
                                                {(
                                                    parseInt(
                                                        formData.tokenSupply,
                                                    ) *
                                                    parseInt(
                                                        formData.tokenPrice,
                                                    )
                                                ).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
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
                                onClick={handleSubmit}
                                disabled={!isStep2Valid}
                            >
                                Create Business
                            </Button>
                        </div>
                    </div>
                )}
            </GlassCard>

            {/* Info Card */}
            <GlassCard className='mt-8 border-primary/20 bg-primary/5 p-6'>
                <div className='flex items-start gap-3'>
                    <div className='flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600'>
                        <Check className='text-white' size={20} />
                    </div>
                    <div>
                        <h3 className='mb-2 font-semibold text-foreground'>
                            What happens next?
                        </h3>
                        <ul className='text-sm text-muted-foreground'>
                            <li className='mt-2'>
                                • Your business will be reviewed by our team
                                (usually 24-48 hours)
                            </li>
                            <li className='mt-2'>
                                • Once approved, your listing will go live on
                                the marketplace
                            </li>
                            <li className='mt-2'>
                                • Investors can start purchasing tokens
                                immediately
                            </li>
                            <li className='mt-2'>
                                • Funds are released based on predefined
                                milestones
                            </li>
                        </ul>
                    </div>
                </div>
            </GlassCard>
        </div>
    );
}
