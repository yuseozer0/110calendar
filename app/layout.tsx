import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Noto_Sans_KR } from 'next/font/google'
import { FirebaseProvider, type FirebaseConfig } from '@/components/firebase-provider'
import './globals.css'

const firebaseConfig: FirebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '',
}

const notoSansKr = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-noto-sans-kr',
})

export const metadata: Metadata = {
  title: '110 캘린더',
  description: '서문여자고등학교 1학년 10반 학급 일정 캘린더',
  applicationName: '110 캘린더',
  manifest: '/manifest.webmanifest',
  generator: '110 캘린더',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '110 캘린더',
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/app-icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/app-icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/app-icon-192.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#2f5240' },
    { media: '(prefers-color-scheme: dark)', color: '#1a2b22' },
  ],
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className={`${notoSansKr.variable} bg-background`}>
      <body className="font-sans antialiased">
        <FirebaseProvider config={firebaseConfig}>{children}</FirebaseProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
