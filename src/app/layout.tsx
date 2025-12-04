import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MDShare - Markdown 分享平台',
  description: '一个简洁优雅的 Markdown 内容分享平台',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  )
}
