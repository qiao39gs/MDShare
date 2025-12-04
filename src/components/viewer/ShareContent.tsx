'use client'

import dynamic from 'next/dynamic'

const MarkdownViewer = dynamic(
  () => import('@/components/viewer/MarkdownViewer'),
  { ssr: false, loading: () => <div className="animate-pulse bg-slate-100 h-96 rounded-lg" /> }
)

interface ShareContentProps {
  content: string
}

export default function ShareContent({ content }: ShareContentProps) {
  return <MarkdownViewer content={content} />
}
