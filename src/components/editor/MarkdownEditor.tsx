'use client'

import { useMemo, useState } from 'react'
import { Editor } from '@bytemd/react'
import gfm from '@bytemd/plugin-gfm'
import highlight from '@bytemd/plugin-highlight'
import mermaid from '@bytemd/plugin-mermaid'
import { cosUploadPlugin } from '@/lib/cos/bytemd-plugin'
import 'bytemd/dist/index.css'
import 'highlight.js/styles/github.css'

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
}

export default function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const plugins = useMemo(() => [
    gfm(),
    highlight(),
    mermaid(),
    cosUploadPlugin({
      maxSize: 10 * 1024 * 1024, // 10MB
      onUploadStart: () => {
        setUploading(true)
        setUploadError(null)
      },
      onUploadEnd: () => {
        setUploading(false)
      },
      onError: (error) => {
        setUploadError(error.message)
        setTimeout(() => setUploadError(null), 5000)
      },
    }),
  ], [])

  return (
    <div className="bytemd-container relative">
      {/* 上传状态提示 */}
      {uploading && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          正在上传图片...
        </div>
      )}

      {/* 错误提示 */}
      {uploadError && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
          {uploadError}
        </div>
      )}

      <Editor
        value={value}
        plugins={plugins}
        onChange={onChange}
        placeholder="在这里输入 Markdown 内容..."
      />

      {/* 上传提示 */}
      <div className="mt-2 text-sm text-gray-500 flex items-center gap-4">
        <span>支持粘贴或拖拽图片上传</span>
        <span>最大 10MB</span>
        <span>支持 JPG、PNG、GIF、WebP</span>
      </div>

      <style jsx global>{`
        .bytemd-container .bytemd {
          height: 600px;
          border-radius: 0.5rem;
          border: 1px solid #e2e8f0;
        }
        .bytemd-container .bytemd-toolbar {
          border-radius: 0.5rem 0.5rem 0 0;
          background: #f8fafc;
        }
        .bytemd-container .bytemd-body {
          border-radius: 0 0 0.5rem 0.5rem;
        }
        .bytemd-container .bytemd-preview {
          padding: 1rem;
        }
        .bytemd-container .bytemd-editor {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        }
      `}</style>
    </div>
  )
}
