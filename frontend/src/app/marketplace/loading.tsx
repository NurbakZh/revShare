import { Skeleton } from '@/components/ui/skeleton'

export default function MarketplaceLoading() {
    return (
        <div className='container mx-auto px-4 py-8'>
            <Skeleton className='mb-8 h-12 w-72 max-w-full rounded-lg' />
            <div className='mb-8 grid grid-cols-1 gap-6 md:grid-cols-2'>
                <Skeleton className='h-24 rounded-3xl' />
                <Skeleton className='h-24 rounded-3xl' />
            </div>
            <Skeleton className='h-14 rounded-2xl' />
            <Skeleton className='mt-8 h-96 rounded-3xl' />
        </div>
    )
}
