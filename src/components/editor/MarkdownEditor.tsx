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
          height: calc(100vh - 180px);
          min-height: 500px;
          border-radius: 0.75rem;
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
        }
        .bytemd-container .bytemd-toolbar {
          border-radius: 0.75rem 0.75rem 0 0;
          background: linear-gradient(to bottom, #f8fafc, #f1f5f9);
          border-bottom: 1px solid #e2e8f0;
          padding: 0.5rem 0.75rem;
        }
        .bytemd-container .bytemd-toolbar-icon {
          width: 32px;
          height: 32px;
          border-radius: 0.375rem;
          transition: all 0.15s ease;
        }
        .bytemd-container .bytemd-toolbar-icon:hover {
          background: #e2e8f0;
        }
        .bytemd-container .bytemd-toolbar-icon.bytemd-tippy-right {
          border-radius: 0.375rem;
        }
        .bytemd-container .bytemd-body {
          border-radius: 0 0 0.75rem 0.75rem;
        }
        .bytemd-container .bytemd-editor {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 14px;
          line-height: 1.7;
          background: #fafafa;
        }
        .bytemd-container .bytemd-editor .CodeMirror {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 14px;
          line-height: 1.7;
          padding: 1rem;
        }
        .bytemd-container .bytemd-editor .CodeMirror-lines {
          padding: 0.5rem 0;
        }
        .bytemd-container .bytemd-preview {
          padding: 1.5rem 2rem;
          background: #ffffff;
        }
        .bytemd-container .bytemd-preview h1 {
          font-size: 2rem;
          font-weight: 700;
          margin-top: 1.5rem;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid #e2e8f0;
        }
        .bytemd-container .bytemd-preview h2 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-top: 1.25rem;
          margin-bottom: 0.75rem;
        }
        .bytemd-container .bytemd-preview h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
        }
        .bytemd-container .bytemd-preview p {
          margin-bottom: 1rem;
          line-height: 1.75;
        }
        .bytemd-container .bytemd-preview code:not(pre code) {
          background: #f1f5f9;
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          font-size: 0.875em;
          color: #e11d48;
        }
        .bytemd-container .bytemd-preview pre {
          background: #1e293b;
          border-radius: 0.5rem;
          padding: 1rem;
          margin: 1rem 0;
          overflow-x: auto;
        }
        .bytemd-container .bytemd-preview pre code {
          color: #e2e8f0;
          font-size: 0.875rem;
          line-height: 1.7;
        }
        .bytemd-container .bytemd-preview blockquote {
          border-left: 4px solid #3b82f6;
          padding-left: 1rem;
          margin: 1rem 0;
          color: #64748b;
          background: #f8fafc;
          padding: 0.75rem 1rem;
          border-radius: 0 0.5rem 0.5rem 0;
        }
        .bytemd-container .bytemd-preview ul,
        .bytemd-container .bytemd-preview ol {
          padding-left: 1.5rem;
          margin-bottom: 1rem;
        }
        .bytemd-container .bytemd-preview li {
          margin-bottom: 0.25rem;
          line-height: 1.75;
        }
        .bytemd-container .bytemd-preview a {
          color: #3b82f6;
          text-decoration: none;
          border-bottom: 1px solid transparent;
          transition: border-color 0.15s ease;
        }
        .bytemd-container .bytemd-preview a:hover {
          border-bottom-color: #3b82f6;
        }
        .bytemd-container .bytemd-preview img {
          max-width: 100%;
          border-radius: 0.5rem;
          margin: 1rem 0;
        }
        .bytemd-container .bytemd-preview table {
          width: 100%;
          border-collapse: collapse;
          margin: 1rem 0;
        }
        .bytemd-container .bytemd-preview th,
        .bytemd-container .bytemd-preview td {
          border: 1px solid #e2e8f0;
          padding: 0.75rem;
          text-align: left;
        }
        .bytemd-container .bytemd-preview th {
          background: #f8fafc;
          font-weight: 600;
        }
        .bytemd-container .bytemd-preview tr:hover {
          background: #f8fafc;
        }
        .bytemd-container .bytemd-status {
          border-top: 1px solid #e2e8f0;
          background: #f8fafc;
          border-radius: 0 0 0.75rem 0.75rem;
          padding: 0.5rem 1rem;
          font-size: 0.75rem;
          color: #64748b;
        }
        .bytemd-container .bytemd-split .bytemd-editor,
        .bytemd-container .bytemd-split .bytemd-preview {
          border-right: 1px solid #e2e8f0;
        }
        .bytemd-container .bytemd-fullscreen {
          z-index: 100;
        }
      `}</style>
    </div>
  )
}
