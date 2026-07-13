import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'OptionKart — NSE Options Analytics',
    template: '%s | OptionKart',
  },
  description:
    'Real-time Nifty & BankNifty options chain analysis, PCR, Max Pain, and AI-powered insights for Indian retail traders.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} min-h-screen bg-[var(--background)] text-[var(--foreground)] antialiased`}
    >
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  );
}
