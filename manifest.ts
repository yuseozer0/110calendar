import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '110 캘린더',
    short_name: '110 캘린더',
    description: '서문여자고등학교 1학년 10반 학급 일정 캘린더',
    start_url: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: '#f4f6f1',
    theme_color: '#2f5240',
    lang: 'ko',
    categories: ['education', 'productivity'],
    icons: [
      {
        src: '/app-icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/app-icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/app-icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
