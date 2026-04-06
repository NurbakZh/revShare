import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
    return (
        <div className='container mx-auto px-4 py-10'>
            <Skeleton className='mx-auto mb-10 h-10 max-w-lg' />
            <div className='mb-10 grid grid-cols-1 gap-6 md:grid-cols-3'>
                {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className='h-28 rounded-3xl' />
                ))}
            </div>
            <div className='mx-auto max-w-4xl space-y-4'>
                <Skeleton className='h-12 w-full rounded-2xl' />
                <Skeleton className='h-12 w-full rounded-2xl' />
                <Skeleton className='h-40 w-full rounded-2xl' />
            </div>
        </div>
    )
}
