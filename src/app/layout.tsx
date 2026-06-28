import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import ServiceWorkerRegistration from './ServiceWorkerRegistration'
import './globals.css'

const geist = Geist({ variable: '--font-geist', subsets: ['latin'] })

export const metadata: Metadata = {
  title: '漢字の庭',
  description: 'Learn all 2136 Jōyō kanji through a Pokémon HeartGold/SoulSilver adventure.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '漢字の庭',
  },
}

export const viewport: Viewport = {
  themeColor: '#111827',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-gray-900">
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  )
}
