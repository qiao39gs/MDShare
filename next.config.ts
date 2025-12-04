import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.cos.ap-beijing.myqcloud.com',
      },
      {
        protocol: 'https',
        hostname: '*.picbj.myqcloud.com',
      },
    ],
  },
}

export default nextConfig
