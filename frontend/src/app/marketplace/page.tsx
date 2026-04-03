'use client';

import { GlassCard } from '@/components/GlassCard';
import { GradientButton } from '@/components/GradientButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { mockMarketListings } from '@/lib/data';
import { Plus, Search, ShoppingCart, TrendingUp } from 'lucide-react';
import React, { useState } from 'react';

export default function MarketplacePage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [showListModal, setShowListModal] = useState(false);
    const [showBuyModal, setShowBuyModal] = useState(false);
    const [selectedListing, setSelectedListing] = useState<any>(null);

    const [listingForm, setListingForm] = useState({
        business: '',
        tokens: '',
        price: '',
    });

    const filteredListings = mockMarketListings.filter((listing) =>
        listing.businessName.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    const handleBuy = (listing: any) => {
        setSelectedListing(listing);
        setShowBuyModal(true);
    };

    return (
        <div className='container mx-auto px-4 py-8 '>
            {/* Header */}
            <div className='mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center'>
                <div>
                    <h1 className='mb-2 text-4xl font-bold text-foreground'>
                        Token Marketplace
                    </h1>
                    <p className='text-muted-foreground'>
                        Buy and sell revenue tokens on the secondary market
                    </p>
                </div>
                <Button
                    variant='brand'
                    size='lg'
                    onClick={() => setShowListModal(true)}
                >
                    <Plus size={20} className='mr-2' />
                    List Tokens
                </Button>
            </div>

            {/* Stats */}
            <div className='mt-8 grid grid-cols-1 gap-6 md:grid-cols-3'>
                <GlassCard className='p-6'>
                    <div className='flex items-center gap-4'>
                        <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-cyan-600'>
                            <ShoppingCart className='text-white' size={24} />
                        </div>
                        <div>
                            <div className='text-2xl font-bold text-foreground'>
                                {filteredListings.length}
                            </div>
                            <p className='text-sm text-muted-foreground'>
                                Active Listings
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
                                $27K
                            </div>
                            <p className='text-sm text-muted-foreground'>
                                24h Volume
                            </p>
                        </div>
                    </div>
                </GlassCard>

                <GlassCard className='p-6'>
                    <div className='flex items-center gap-4'>
                        <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-600 to-purple-600'>
                            <TrendingUp className='text-white' size={24} />
                        </div>
                        <div>
                            <div className='text-2xl font-bold text-foreground'>
                                425
                            </div>
                            <p className='text-sm text-muted-foreground'>
                                Total Tokens Listed
                            </p>
                        </div>
                    </div>
                </GlassCard>
            </div>

            {/* Search */}
            <GlassCard className='mt-8 p-6'>
                <div className='relative'>
                    <Search
                        className='absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground'
                        size={20}
                    />
                    <Input
                        type='text'
                        placeholder='Search by business name...'
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className='pl-12'
                    />
                </div>
            </GlassCard>

            {/* Listings Table */}
            <GlassCard className='mt-8 overflow-hidden p-8'>
                <h2 className='mb-6 text-2xl font-bold text-foreground'>
                    Available Listings
                </h2>

                <div className='overflow-x-auto'>
                    <table className='w-full'>
                        <thead>
                            <tr className='border-b border-border'>
                                <th className='px-4 py-4 text-left text-sm font-medium text-muted-foreground'>
                                    Business
                                </th>
                                <th className='px-4 py-4 text-left text-sm font-medium text-muted-foreground'>
                                    Seller
                                </th>
                                <th className='px-4 py-4 text-left text-sm font-medium text-muted-foreground'>
                                    Price per Token
                                </th>
                                <th className='px-4 py-4 text-left text-sm font-medium text-muted-foreground'>
                                    Tokens Available
                                </th>
                                <th className='px-4 py-4 text-left text-sm font-medium text-muted-foreground'>
                                    Total Value
                                </th>
                                <th className='px-4 py-4 text-left text-sm font-medium text-muted-foreground'>
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredListings.map((listing) => (
                                <tr
                                    key={listing.id}
                                    className='border-b border-border/50 transition-colors hover:bg-accent/5'
                                >
                                    <td className='px-4 py-4'>
                                        <div className='font-semibold text-foreground'>
                                            {listing.businessName}
                                        </div>
                                    </td>
                                    <td className='px-4 py-4'>
                                        <div className='font-mono text-sm text-muted-foreground'>
                                            {listing.seller}
                                        </div>
                                    </td>
                                    <td className='px-4 py-4'>
                                        <div className='font-semibold text-foreground'>
                                            ${listing.pricePerToken}
                                        </div>
                                    </td>
                                    <td className='px-4 py-4'>
                                        <div className='text-muted-foreground'>
                                            {listing.tokensAvailable}
                                        </div>
                                    </td>
                                    <td className='px-4 py-4'>
                                        <div className='font-semibold text-primary'>
                                            $
                                            {listing.totalValue.toLocaleString()}
                                        </div>
                                    </td>
                                    <td className='px-4 py-4'>
                                        <Button
                                            variant='brand'
                                            size='sm'
                                            onClick={() => handleBuy(listing)}
                                        >
                                            Buy
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredListings.length === 0 && (
                    <div className='py-16 text-center'>
                        <ShoppingCart
                            size={48}
                            className='mx-auto mb-4 text-muted-foreground opacity-20'
                        />
                        <p className='text-xl text-muted-foreground'>
                            No listings found
                        </p>
                        <p className='text-muted-foreground/60'>
                            Try a different search term
                        </p>
                    </div>
                )}
            </GlassCard>

            {/* List Tokens Modal */}
            {showListModal && (
                <div
                    className='m-0! fixed bottom-0 left-0 right-0 top-0 z-[99999] flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-lg duration-300 animate-in fade-in'
                    onClick={() => setShowListModal(false)}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className='w-full max-w-md'
                    >
                        <GlassCard className='relative p-8'>
                            <h2 className='mb-6 text-2xl font-bold text-foreground'>
                                List Tokens for Sale
                            </h2>

                            <div className='mb-6'>
                                <div>
                                    <label className='mb-2 block text-sm font-medium text-muted-foreground'>
                                        Select Business
                                    </label>
                                    <Select
                                        onValueChange={(value: string) =>
                                            setListingForm({
                                                ...listingForm,
                                                business: value,
                                            })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder='Select a business' />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value='1'>
                                                Brew & Bytes Café (250 tokens)
                                            </SelectItem>
                                            <SelectItem value='2'>
                                                GreenLeaf Organics (150 tokens)
                                            </SelectItem>
                                            <SelectItem value='4'>
                                                TechRepair Pro (100 tokens)
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className='mt-4'>
                                    <label className='mb-2 block text-sm font-medium text-muted-foreground'>
                                        Number of Tokens
                                    </label>
                                    <Input
                                        type='number'
                                        placeholder='e.g., 50'
                                        value={listingForm.tokens}
                                        onChange={(e) =>
                                            setListingForm({
                                                ...listingForm,
                                                tokens: e.target.value,
                                            })
                                        }
                                    />
                                </div>

                                <div className='mt-4'>
                                    <label className='mb-2 block text-sm font-medium text-muted-foreground'>
                                        Price per Token ($)
                                    </label>
                                    <Input
                                        type='number'
                                        placeholder='e.g., 55'
                                        value={listingForm.price}
                                        onChange={(e) =>
                                            setListingForm({
                                                ...listingForm,
                                                price: e.target.value,
                                            })
                                        }
                                    />
                                </div>

                                {listingForm.tokens && listingForm.price && (
                                    <div className='mt-4 rounded-2xl border border-primary/30 bg-primary/10 p-4'>
                                        <div className='flex justify-between'>
                                            <span className='text-primary'>
                                                Total Listing Value
                                            </span>
                                            <span className='font-bold text-foreground'>
                                                $
                                                {(
                                                    parseFloat(
                                                        listingForm.tokens,
                                                    ) *
                                                    parseFloat(
                                                        listingForm.price,
                                                    )
                                                ).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className='flex gap-3'>
                                <Button
                                    variant='outline'
                                    className='flex-1'
                                    onClick={() => setShowListModal(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant='brand'
                                    className='flex-1 bg-gradient-to-r from-purple-600 to-cyan-600 transition-all hover:shadow-lg hover:shadow-purple-500/30 active:scale-95'
                                    onClick={() => {
                                        setShowListModal(false);
                                        setListingForm({
                                            business: '',
                                            tokens: '',
                                            price: '',
                                        });
                                    }}
                                >
                                    List Tokens
                                </Button>
                            </div>
                        </GlassCard>
                    </div>
                </div>
            )}

            {/* Buy Modal */}
            {showBuyModal && selectedListing && (
                <div
                    className='m-0! fixed bottom-0 left-0 right-0 top-0 z-[99999] flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-lg duration-300 animate-in fade-in'
                    onClick={() => setShowBuyModal(false)}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className='w-full max-w-md'
                    >
                        <GlassCard className='p-8'>
                            <h2 className='mb-6 text-2xl font-bold text-foreground'>
                                Confirm Purchase
                            </h2>

                            <div className='mb-6'>
                                <div className='flex justify-between'>
                                    <span className='text-muted-foreground'>
                                        Business
                                    </span>
                                    <span className='font-semibold text-foreground'>
                                        {selectedListing.businessName}
                                    </span>
                                </div>
                                <div className='mt-4 flex justify-between'>
                                    <span className='text-muted-foreground'>
                                        Seller
                                    </span>
                                    <span className='font-mono text-sm text-foreground'>
                                        {selectedListing.seller}
                                    </span>
                                </div>
                                <div className='mt-4 flex justify-between'>
                                    <span className='text-muted-foreground'>
                                        Tokens
                                    </span>
                                    <span className='font-semibold text-foreground'>
                                        {selectedListing.tokensAvailable}
                                    </span>
                                </div>
                                <div className='mt-4 flex justify-between'>
                                    <span className='text-muted-foreground'>
                                        Price per Token
                                    </span>
                                    <span className='font-semibold text-foreground'>
                                        ${selectedListing.pricePerToken}
                                    </span>
                                </div>
                                <div className='mt-4 border-t border-border pt-4'>
                                    <div className='flex justify-between'>
                                        <span className='font-semibold text-foreground'>
                                            Total Cost
                                        </span>
                                        <span className='font-bold text-primary'>
                                            $
                                            {selectedListing.totalValue.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className='flex gap-3'>
                                <Button
                                    variant='outline'
                                    className='flex-1'
                                    onClick={() => {
                                        setShowBuyModal(false);
                                        setSelectedListing(null);
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant='brand'
                                    className='flex-1 bg-gradient-to-r from-purple-600 to-cyan-600 transition-all hover:shadow-lg hover:shadow-purple-500/30 active:scale-95'
                                    onClick={() => {
                                        setShowBuyModal(false);
                                        setSelectedListing(null);
                                    }}
                                >
                                    Buy Now
                                </Button>
                            </div>
                        </GlassCard>
                    </div>
                </div>
            )}
        </div>
    );
}
