export default function MarketplaceLoading() {
    return (
        <div className='container mx-auto px-4 py-8'>
            <div className='mb-8 h-12 w-72 max-w-full animate-pulse rounded-lg bg-muted/60' />
            <div className='mb-8 grid grid-cols-1 gap-6 md:grid-cols-2'>
                <div className='h-24 animate-pulse rounded-3xl bg-muted/50' />
                <div className='h-24 animate-pulse rounded-3xl bg-muted/50' />
            </div>
            <div className='h-14 animate-pulse rounded-2xl bg-muted/40' />
        </div>
    )
}
