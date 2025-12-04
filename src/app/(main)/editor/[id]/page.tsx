'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import dynamic from 'next/dynamic'

const MarkdownEditor = dynamic(
  () => import('@/components/editor/MarkdownEditor'),
  { ssr: false, loading: () => <div className="h-[600px] bg-slate-100 animate-pulse rounded-lg" /> }
)

interface Post {
  id: string
  title: string
  content: string
  status: string
  short_code: string
  access_type: string
  is_pinned: boolean
}

export default function EditorPage() {
  const router = useRouter()
  const params = useParams()
  const postId = params.id as string

  const [post, setPost] = useState<Post | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [autoSaved, setAutoSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  // 加载文章
  useEffect(() => {
    const loadPost = async () => {
      try {
        const response = await fetch(`/api/posts/${postId}`)
        const result = await response.json()

        if (!response.ok) {
          console.error('加载文章失败:', result.error)
          router.push('/dashboard')
          return
        }

        setPost(result.data)
        setTitle(result.data.title)
        setContent(result.data.content)
        setLoading(false)
      } catch (error) {
        console.error('加载文章失败:', error)
        router.push('/dashboard')
      }
    }

    loadPost()
  }, [postId, router])

  // 自动保存
  const autoSave = useCallback(async () => {
    if (!post || saving) return

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), content }),
      })

      if (response.ok) {
        setAutoSaved(true)
        setTimeout(() => setAutoSaved(false), 2000)
      }
    } catch (error) {
      console.error('自动保存失败:', error)
    }
  }, [post, postId, title, content, saving])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (post && (title !== post.title || content !== post.content)) {
        autoSave()
      }
    }, 2000)
    return () => clearTimeout(timer)
  }, [title, content, post, autoSave])

  const handleSave = async (status?: 'draft' | 'published') => {
    if (!title.trim()) {
      alert('请输入标题')
      return
    }

    setSaving(true)

    try {
      const updateData: Record<string, unknown> = {
        title: title.trim(),
        content,
      }

      if (status) {
        updateData.status = status
      }

      const response = await fetch(`/api/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '保存失败')
      }

      setPost(prev => prev ? { ...prev, ...updateData } as Post : null)
      if (status === 'published') {
        alert('发布成功！')
      }
    } catch (error) {
      console.error('保存失败:', error)
      alert('保存失败: ' + (error instanceof Error ? error.message : '未知错误'))
    }

    setSaving(false)
  }

  const handleDelete = async () => {
    if (!confirm('确定要删除这篇文章吗？删除后将移入回收站。')) {
      return
    }

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || '删除失败')
      }

      router.push('/dashboard')
    } catch (error) {
      alert('删除失败: ' + (error instanceof Error ? error.message : '未知错误'))
    }
  }

  const copyShareLink = () => {
    if (post) {
      const url = `${window.location.origin}/s/${post.short_code}`
      navigator.clipboard.writeText(url)
      alert('分享链接已复制到剪贴板')
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="h-10 bg-slate-100 animate-pulse rounded mb-4" />
        <div className="h-[600px] bg-slate-100 animate-pulse rounded-lg" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="输入文章标题..."
          className="text-2xl font-bold bg-transparent border-none outline-none flex-1 text-slate-900 placeholder:text-slate-400"
        />
        <div className="flex items-center gap-2">
          {autoSaved && (
            <span className="text-sm text-slate-500">已自动保存</span>
          )}
          {post?.status === 'published' && (
            <button
              onClick={copyShareLink}
              className="px-3 py-2 text-sm border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
            >
              复制链接
            </button>
          )}
          <button
            onClick={() => handleSave()}
            disabled={saving}
            className="px-4 py-2 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存'}
          </button>
          {post?.status !== 'published' && (
            <button
              onClick={() => handleSave('published')}
              disabled={saving}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              发布
            </button>
          )}
          <button
            onClick={handleDelete}
            className="px-3 py-2 text-sm text-red-500 border border-red-200 rounded-md hover:bg-red-50 transition-colors"
          >
            删除
          </button>
        </div>
      </div>

      <MarkdownEditor value={content} onChange={setContent} />
    </div>
  )
}
