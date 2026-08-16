/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/__/auth/:path*',
        destination: 'https://calendar-seo0.firebaseapp.com/__/auth/:path*',
      },
    ]
  },
}

export default nextConfig
