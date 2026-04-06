import { GlassCard } from '@/components/GlassCard'
import { Skeleton } from '@/components/ui/skeleton'

export function HomeStatsSkeleton() {
    return (
        <div className='mt-8 grid grid-cols-1 gap-6 md:grid-cols-3'>
            {[1, 2, 3].map((i) => (
                <GlassCard key={i} className='p-6'>
                    <div className='flex items-center gap-4'>
                        <Skeleton className='h-12 w-12 shrink-0 rounded-2xl' />
                        <div className='min-w-0 flex-1 space-y-2'>
                            <Skeleton className='h-8 w-16' />
                            <Skeleton className='h-4 w-24' />
                        </div>
                    </div>
                </GlassCard>
            ))}
        </div>
    )
}

export function HomeFiltersSkeleton() {
    return (
        <GlassCard className='mt-8 p-6'>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-12'>
                <Skeleton className='h-12 md:col-span-5' />
                <Skeleton className='h-12 md:col-span-3' />
                <Skeleton className='h-12 md:col-span-2' />
                <Skeleton className='h-12 md:col-span-2' />
            </div>
        </GlassCard>
    )
}

export function BusinessCardGridSkeleton({ count = 6 }: { count?: number }) {
    return (
        <div className='mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
            {Array.from({ length: count }).map((_, i) => (
                <GlassCard key={i} className='p-6'>
                    <Skeleton className='mb-4 h-6 max-w-[280px]' />
                    <Skeleton className='mb-2 h-4 w-full' />
                    <Skeleton className='mb-6 h-4 max-w-[66%]' />
                    <div className='mb-4 flex gap-2'>
                        <Skeleton className='h-8 w-20 rounded-full' />
                        <Skeleton className='h-8 w-16 rounded-full' />
                    </div>
                    <Skeleton className='h-24 w-full rounded-2xl' />
                    <Skeleton className='mt-4 h-10 w-full rounded-xl' />
                </GlassCard>
            ))}
        </div>
    )
}

export function MarketplaceStatsSkeleton() {
    return (
        <div className='mt-8 grid grid-cols-1 gap-6 md:grid-cols-2'>
            {[1, 2].map((i) => (
                <GlassCard key={i} className='p-6'>
                    <div className='flex items-center gap-4'>
                        <Skeleton className='h-12 w-12 shrink-0 rounded-2xl' />
                        <div className='space-y-2'>
                            <Skeleton className='h-8 w-20' />
                            <Skeleton className='h-4 w-32' />
                        </div>
                    </div>
                </GlassCard>
            ))}
        </div>
    )
}

export function MarketplaceSearchSkeleton() {
    return (
        <GlassCard className='mt-8 p-6'>
            <Skeleton className='h-12 w-full' />
        </GlassCard>
    )
}

export function MarketplaceTableSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <GlassCard className='mt-8 overflow-hidden p-8'>
            <Skeleton className='mb-6 h-8 w-40' />
            <div className='space-y-3'>
                <div className='flex gap-4 border-b border-border pb-3'>
                    <Skeleton className='h-4 flex-1' />
                    <Skeleton className='h-4 w-24' />
                    <Skeleton className='h-4 w-28' />
                    <Skeleton className='h-4 w-16' />
                    <Skeleton className='h-4 w-20' />
                </div>
                {Array.from({ length: rows }).map((_, i) => (
                    <div
                        key={i}
                        className='flex items-center gap-4 border-b border-border/40 py-3'
                    >
                        <Skeleton className='h-5 flex-1' />
                        <Skeleton className='h-5 w-24' />
                        <Skeleton className='h-5 w-28' />
                        <Skeleton className='h-5 w-16' />
                        <Skeleton className='h-9 w-16 shrink-0 rounded-lg' />
                    </div>
                ))}
            </div>
        </GlassCard>
    )
}

export function BusinessDetailPageSkeleton() {
    return (
        <div className='container mx-auto px-4 py-8'>
            <Skeleton className='h-5 w-24' />
            <GlassCard className='mt-8 p-8'>
                <div className='grid grid-cols-1 gap-8 lg:grid-cols-2'>
                    <div>
                        <div className='mb-6 flex items-center gap-4'>
                            <Skeleton className='h-20 w-20 shrink-0 rounded-2xl' />
                            <div className='min-w-0 flex-1 space-y-2'>
                                <Skeleton className='h-9 w-48' />
                                <Skeleton className='h-5 w-32' />
                            </div>
                        </div>
                        <Skeleton className='mb-6 h-20 w-full' />
                        <div className='mb-6 grid grid-cols-2 gap-4'>
                            {[1, 2, 3, 4].map((i) => (
                                <Skeleton
                                    key={i}
                                    className='h-24 w-full rounded-2xl'
                                />
                            ))}
                        </div>
                    </div>
                    <div className='space-y-4'>
                        <Skeleton className='h-64 w-full rounded-2xl' />
                        <Skeleton className='h-12 w-full rounded-xl' />
                    </div>
                </div>
            </GlassCard>
        </div>
    )
}

export function InvestorPositionsSkeleton() {
    return (
        <ul className='space-y-6'>
            {[1, 2, 3].map((i) => (
                <li
                    key={i}
                    className='rounded-2xl border border-border p-5'
                >
                    <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
                        <div className='flex min-w-0 flex-1 gap-4'>
                            <Skeleton className='h-14 w-14 shrink-0 rounded-2xl' />
                            <div className='min-w-0 flex-1 space-y-2'>
                                <Skeleton className='h-6 w-48' />
                                <Skeleton className='h-4 w-32' />
                                <Skeleton className='h-12 w-full' />
                            </div>
                        </div>
                        <div className='flex shrink-0 flex-col gap-2 sm:items-end'>
                            <Skeleton className='h-7 w-20 rounded-full' />
                            <Skeleton className='h-9 w-24 rounded-lg' />
                        </div>
                    </div>
                    <div className='mt-4 grid grid-cols-2 gap-3 border-t border-border/60 pt-4 md:grid-cols-4'>
                        {[1, 2, 3, 4].map((j) => (
                            <div key={j}>
                                <Skeleton className='mb-1 h-3 w-16' />
                                <Skeleton className='h-5 w-20' />
                            </div>
                        ))}
                    </div>
                </li>
            ))}
        </ul>
    )
}

export function BusinessDashboardSkeleton() {
    return (
        <div className='container mx-auto px-4 py-8'>
            <Skeleton className='mb-8 h-10 w-64 max-w-full' />
            <div className='mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4'>
                {[1, 2, 3, 4].map((i) => (
                    <GlassCard key={i} className='p-6'>
                        <Skeleton className='mb-2 h-4 w-24' />
                        <Skeleton className='h-8 w-32' />
                    </GlassCard>
                ))}
            </div>
            <GlassCard className='p-8'>
                <Skeleton className='mb-6 h-8 w-48' />
                <Skeleton className='h-64 w-full rounded-2xl' />
            </GlassCard>
        </div>
    )
}

export function ProfilePageSkeleton() {
    return (
        <div className='container mx-auto px-4 py-8'>
            <div className='mb-8 flex items-center justify-between'>
                <Skeleton className='h-10 w-48' />
                <Skeleton className='h-10 w-28 rounded-lg' />
            </div>
            <div className='mb-8 grid grid-cols-1 gap-8 lg:grid-cols-3'>
                <GlassCard className='h-fit p-8'>
                    <div className='text-center'>
                        <Skeleton className='mx-auto mb-4 h-24 w-24 rounded-full' />
                        <Skeleton className='mx-auto mb-2 h-7 w-40' />
                        <Skeleton className='mx-auto h-4 w-full max-w-xs' />
                    </div>
                </GlassCard>
                <div className='space-y-8 lg:col-span-2'>
                    <GlassCard className='p-8'>
                        <div className='mb-6 flex items-center justify-between'>
                            <Skeleton className='h-8 w-48' />
                            <Skeleton className='h-7 w-20 rounded-full' />
                        </div>
                        <Skeleton className='mb-4 h-4 w-full' />
                        <Skeleton className='h-4 max-w-md' />
                        <Skeleton className='mt-6 h-10 w-48 rounded-lg' />
                    </GlassCard>
                </div>
            </div>
        </div>
    )
}

export function SellHoldingsModalSkeleton() {
    return (
        <div className='space-y-4'>
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-4 w-4/5' />
            <Skeleton className='h-12 w-full' />
            <Skeleton className='h-12 w-full' />
            <div className='flex gap-3 pt-2'>
                <Skeleton className='h-10 flex-1 rounded-lg' />
                <Skeleton className='h-10 flex-1 rounded-lg' />
            </div>
        </div>
    )
}
