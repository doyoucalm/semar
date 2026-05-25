import type { Metadata } from 'next';
import { EB_Garamond, Noto_Serif_TC, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Nav } from '@/components/Nav';

const ebGaramond = EB_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});

const notoSerifTC = Noto_Serif_TC({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-cn',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: '天人合一 Codex',
  description: 'Codex tidak memberi jawaban. Codex memberi mata.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${ebGaramond.variable} ${notoSerifTC.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-ink text-parchment">
        <div className="flex flex-col min-h-screen max-w-lg mx-auto relative">
          <main className="flex-1 pb-20">{children}</main>
          <Nav />
        </div>
      </body>
    </html>
  );
}
