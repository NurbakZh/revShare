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
            <body className={inter.className}>
                <nav className='flex items-center justify-between border-b p-4'>
                    <span className='text-xl font-bold'>revShare</span>
                </nav>
                <main>{children}</main>
            </body>
        </html>
    );
}
