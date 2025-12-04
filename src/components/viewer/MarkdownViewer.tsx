'use client'

import { useMemo } from 'react'
import { Viewer } from '@bytemd/react'
import gfm from '@bytemd/plugin-gfm'
import highlight from '@bytemd/plugin-highlight'
import mermaid from '@bytemd/plugin-mermaid'
import 'bytemd/dist/index.css'
import 'highlight.js/styles/github.css'

interface MarkdownViewerProps {
  content: string
}

export default function MarkdownViewer({ content }: MarkdownViewerProps) {
  const plugins = useMemo(() => [
    gfm(),
    highlight(),
    mermaid()
  ], [])

  return (
    <div className="markdown-viewer">
      <Viewer value={content} plugins={plugins} />
      <style jsx global>{`
        .markdown-viewer .markdown-body {
          font-size: 1rem;
          line-height: 1.75;
          color: #1e293b;
        }
        .markdown-viewer .markdown-body h1 {
          font-size: 2rem;
          font-weight: 700;
          margin-top: 2rem;
          margin-bottom: 1rem;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 0.5rem;
        }
        .markdown-viewer .markdown-body h2 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
        }
        .markdown-viewer .markdown-body h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 1.25rem;
          margin-bottom: 0.5rem;
        }
        .markdown-viewer .markdown-body p {
          margin-bottom: 1rem;
        }
        .markdown-viewer .markdown-body pre {
          background: #f1f5f9;
          border-radius: 0.5rem;
          padding: 1rem;
          overflow-x: auto;
          margin: 1rem 0;
        }
        .markdown-viewer .markdown-body code {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 0.875rem;
        }
        .markdown-viewer .markdown-body :not(pre) > code {
          background: #f1f5f9;
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
        }
        .markdown-viewer .markdown-body a {
          color: #3b82f6;
          text-decoration: none;
        }
        .markdown-viewer .markdown-body a:hover {
          text-decoration: underline;
        }
        .markdown-viewer .markdown-body img {
          max-width: 100%;
          border-radius: 0.5rem;
          margin: 1rem 0;
        }
        .markdown-viewer .markdown-body blockquote {
          border-left: 4px solid #e2e8f0;
          padding-left: 1rem;
          margin: 1rem 0;
          color: #64748b;
        }
        .markdown-viewer .markdown-body ul,
        .markdown-viewer .markdown-body ol {
          padding-left: 1.5rem;
          margin-bottom: 1rem;
        }
        .markdown-viewer .markdown-body li {
          margin-bottom: 0.25rem;
        }
        .markdown-viewer .markdown-body table {
          width: 100%;
          border-collapse: collapse;
          margin: 1rem 0;
        }
        .markdown-viewer .markdown-body th,
        .markdown-viewer .markdown-body td {
          border: 1px solid #e2e8f0;
          padding: 0.5rem 0.75rem;
          text-align: left;
        }
        .markdown-viewer .markdown-body th {
          background: #f8fafc;
          font-weight: 600;
        }
        .markdown-viewer .markdown-body hr {
          border: none;
          border-top: 1px solid #e2e8f0;
          margin: 2rem 0;
        }
      `}</style>
    </div>
  )
}
