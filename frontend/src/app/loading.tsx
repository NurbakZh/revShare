export default function Loading() {
    return (
        <div className='flex min-h-[50vh] flex-col items-center justify-center px-4 py-16'>
            <div
                className='h-10 w-10 animate-spin rounded-full border-2 border-violet-500/30 border-t-violet-500'
                aria-hidden
            />
            <p className='mt-4 text-sm text-muted-foreground'>Loading…</p>
        </div>
    )
}
