import type { Metadata } from 'next';
import { Fraunces, Inter } from 'next/font/google';
import { timeOfDay } from '@/lib/mail';
import './globals.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-serif',
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Daily Check-In · Action for Happiness',
  description: 'A small daily practice for a happier life — breathe, reflect, feel grateful, set an intention.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const tod = timeOfDay();
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`} data-time={tod}>
      <body>{children}</body>
    </html>
  );
}
