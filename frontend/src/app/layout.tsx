import { Header } from '@/components/Header';
import { ThemeWrapper } from '@/components/ThemeWrapper';
import { SolanaProviders } from '@/lib/solana/SolanaProviders';
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
        <html lang='en' suppressHydrationWarning>
            <body
                className={`${inter.className} flex min-h-[100dvh] flex-col overflow-x-hidden text-foreground antialiased transition-colors duration-300`}
            >
                <SolanaProviders>
                    <ThemeWrapper>
                        <Header />
                        <main className='relative min-h-0 min-w-0 flex-1'>
                            {children}
                        </main>
                    </ThemeWrapper>
                </SolanaProviders>
            </body>
        </html>
    );
}
