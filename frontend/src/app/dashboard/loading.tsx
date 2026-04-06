export default function DashboardLoading() {
    return (
        <div className='container mx-auto px-4 py-10'>
            <div className='mb-8 h-10 w-64 max-w-full animate-pulse rounded-lg bg-muted/60' />
            <div className='mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4'>
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className='h-28 animate-pulse rounded-3xl bg-muted/50'
                    />
                ))}
            </div>
            <div className='h-64 animate-pulse rounded-3xl bg-muted/40' />
        </div>
    )
}
