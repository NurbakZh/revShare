import { Header } from '@/components/Header';
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
        <html lang='en' suppressHydrationWarning>
            <body
                className={`${inter.className} min-h-screen bg-background text-foreground transition-colors duration-300`}
            >
                <ThemeWrapper>
                    <div className='pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(120,0,255,0.05),transparent_50%)]' />
                    <Header />
                    <main className='relative min-h-[calc(100vh-80px)]'>
                        {children}
                    </main>
                </ThemeWrapper>
            </body>
        </html>
    );
}
