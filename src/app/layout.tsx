import type { Metadata, Viewport } from 'next'
import { BIZ_UDGothic, DotGothic16, Geist } from 'next/font/google'
import ServiceWorkerRegistration from './ServiceWorkerRegistration'
import { AudioManagerProvider } from '@/lib/audio-manager'
import './globals.css'

const geist = Geist({ variable: '--font-geist', subsets: ['latin'] })

// Deux fontes japonaises, deux registres (PRD § Typographie japonaise) :
// chrome/overworld en DotGothic16 (pixel, rétro DS), lecture en BIZ UDGothic
// (Universal Design, pensée pour l'éducation). Classes : .font-chrome /
// .font-reading dans globals.css.
const dotGothic = DotGothic16({
  weight: '400',
  variable: '--font-dotgothic16',
  subsets: ['latin'],
  preload: false, // les slices japonaises sont servies par unicode-range
})
const bizUdGothic = BIZ_UDGothic({
  weight: ['400', '700'],
  variable: '--font-biz-udgothic',
  subsets: ['latin'],
  preload: false,
})

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
    <html
      lang="ja"
      className={`${geist.variable} ${dotGothic.variable} ${bizUdGothic.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-900">
        <ServiceWorkerRegistration />
        <AudioManagerProvider>{children}</AudioManagerProvider>
      </body>
    </html>
  )
}
