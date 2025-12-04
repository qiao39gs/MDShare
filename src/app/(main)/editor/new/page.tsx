'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

// 动态导入编辑器以避免 SSR 问题
const MarkdownEditor = dynamic(
  () => import('@/components/editor/MarkdownEditor'),
  { ssr: false, loading: () => <div className="h-[600px] bg-slate-100 animate-pulse rounded-lg" /> }
)

export default function NewEditorPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [autoSaved, setAutoSaved] = useState(false)

  // 自动保存到 localStorage
  useEffect(() => {
    const draft = localStorage.getItem('mdshare_draft')
    if (draft) {
      const { title: savedTitle, content: savedContent } = JSON.parse(draft)
      setTitle(savedTitle || '')
      setContent(savedContent || '')
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (title || content) {
        localStorage.setItem('mdshare_draft', JSON.stringify({ title, content }))
        setAutoSaved(true)
        setTimeout(() => setAutoSaved(false), 2000)
      }
    }, 1000)
    return () => clearTimeout(timer)
  }, [title, content])

  const handleSave = async (status: 'draft' | 'published' = 'draft') => {
    if (!title.trim()) {
      alert('请输入标题')
      return
    }

    setSaving(true)

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), content, status }),
      })

      const result = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login')
          return
        }
        throw new Error(result.error || '保存失败')
      }

      // 清除草稿
      localStorage.removeItem('mdshare_draft')

      // 跳转到编辑页面
      router.push(`/editor/${result.data.id}`)
    } catch (error) {
      console.error('保存失败:', error)
      alert('保存失败: ' + (error instanceof Error ? error.message : '未知错误'))
      setSaving(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="输入文章标题..."
          className="text-2xl font-bold bg-transparent border-none outline-none w-full text-slate-900 placeholder:text-slate-400"
        />
        <div className="flex items-center gap-2">
          {autoSaved && (
            <span className="text-sm text-slate-500">已自动保存</span>
          )}
          <button
            onClick={() => handleSave('draft')}
            disabled={saving}
            className="px-4 py-2 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存草稿'}
          </button>
          <button
            onClick={() => handleSave('published')}
            disabled={saving}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            发布
          </button>
        </div>
      </div>

      <MarkdownEditor value={content} onChange={setContent} />
    </div>
  )
}
