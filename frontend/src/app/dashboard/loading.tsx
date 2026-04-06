import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardLoading() {
    return (
        <div className='container mx-auto px-4 py-10'>
            <Skeleton className='mb-8 h-10 w-64 max-w-full rounded-lg' />
            <div className='mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4'>
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className='h-28 rounded-3xl' />
                ))}
            </div>
            <Skeleton className='h-64 rounded-3xl' />
        </div>
    )
}
