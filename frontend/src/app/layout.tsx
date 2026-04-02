import { ThemeToggle } from '@/components/ThemeToggle';
import { ThemeWrapper } from '@/components/ThemeWrapper';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'revShare Demo',
    description: 'Initial version of revShare platform',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang='en'>
            <body
                className={`${inter.className} min-h-screen bg-background text-foreground transition-colors duration-300`}
            >
                <ThemeWrapper>
                    <div className='pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(120,0,255,0.05),transparent_50%)]' />
                    <nav className='sticky top-0 z-50 border-b border-border bg-background/80 p-4 backdrop-blur-md'>
                        <div className='container mx-auto flex items-center justify-between'>
                            <span className='cursor-pointer bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-2xl font-bold text-transparent'>
                                revShare
                            </span>
                            <div className='flex items-center gap-6'>
                                <button className='text-sm font-medium text-muted-foreground transition-colors hover:text-primary'>
                                    Marketplace
                                </button>
                                <button className='text-sm font-medium text-muted-foreground transition-colors hover:text-primary'>
                                    Dashboard
                                </button>
                                <div className='mx-2 h-8 w-[1px] bg-border' />
                                <ThemeToggle />
                                <button className='rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-5 py-2 text-sm font-medium text-white transition-all hover:shadow-lg hover:shadow-purple-500/30 active:scale-95'>
                                    Connect Wallet
                                </button>
                            </div>
                        </div>
                    </nav>
                    <main className='relative'>{children}</main>
                </ThemeWrapper>
            </body>
        </html>
    );
}
