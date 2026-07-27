'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface FileItem {
  id: string
  filename: string
  original_name: string
  cos_key: string
  file_size: number
  mime_type: string
  width: number | null
  height: number | null
  created_at: string
  post: {
    id: string
    title: string
    short_code: string
  } | null
  urls: {
    original: string
    thumbnail: string
    compressed: string
  }
}

interface Profile {
  storage_used: number
  storage_limit: number
}

export default function StoragePage() {
  const [files, setFiles] = useState<FileItem[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchFiles = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/files?page=${page}&limit=20`)
      const data = await res.json()
      if (res.ok) {
        setFiles(data.files || [])
        setTotalPages(data.pagination.totalPages)
        setTotal(data.pagination.total)
      }
    } catch (error) {
      console.error('获取文件列表失败:', error)
    } finally {
      setLoading(false)
    }
  }, [page])

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile')
      const data = await res.json()
      if (res.ok) {
        setProfile(data.profile)
      }
    } catch (error) {
      console.error('获取用户资料失败:', error)
    }
  }

  useEffect(() => {
    fetchFiles()
    fetchProfile()
  }, [fetchFiles])

  const handleDelete = async (fileId: string) => {
    if (!confirm('确定要删除这个文件吗？此操作不可恢复。')) return

    setDeleting(fileId)
    try {
      const res = await fetch(`/api/upload?id=${fileId}`, { method: 'DELETE' })
      if (res.ok) {
        setFiles(files.filter(f => f.id !== fileId))
        fetchProfile()
      } else {
        const data = await res.json()
        alert(data.error || '删除失败')
      }
    } catch (error) {
      console.error('删除文件失败:', error)
      alert('删除失败')
    } finally {
      setDeleting(null)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / 1024 / 1024).toFixed(2) + ' MB'
  }

  const formatDate = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: zhCN })
  }

  const storageUsedMB = ((profile?.storage_used || 0) / 1024 / 1024).toFixed(2)
  const storageLimitMB = ((profile?.storage_limit || 524288000) / 1024 / 1024).toFixed(0)
  const storagePercent = ((profile?.storage_used || 0) / (profile?.storage_limit || 524288000) * 100)

  const isImage = (mimeType: string) => mimeType.startsWith('image/')

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">存储空间</h1>
          <p className="text-slate-500 mt-1">管理您上传的文件</p>
        </div>
        <Link
          href="/dashboard"
          className="px-4 py-2 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
        >
          返回控制台
        </Link>
      </div>

      {/* 存储空间统计 */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900">存储使用情况</h2>
          <span className="text-sm text-slate-500">{total} 个文件</span>
        </div>
        <div className="flex items-end gap-4 mb-2">
          <span className="text-3xl font-bold text-slate-900">{storageUsedMB}</span>
          <span className="text-slate-500 mb-1">/ {storageLimitMB} MB</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${
              storagePercent > 90 ? 'bg-red-500' : storagePercent > 70 ? 'bg-yellow-500' : 'bg-blue-500'
            }`}
            style={{ width: `${Math.min(storagePercent, 100)}%` }}
          />
        </div>
        <p className="text-sm text-slate-500 mt-2">
          已使用 {storagePercent.toFixed(1)}% 的存储空间
        </p>
      </div>

      {/* 文件列表 */}
      <div className="bg-white rounded-lg border border-slate-200">
        <div className="p-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-900">文件列表</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500">加载中...</div>
        ) : files.length > 0 ? (
          <>
            <div className="divide-y divide-slate-200">
              {files.map((file) => (
                <div key={file.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    {/* 缩略图 */}
                    <div className="w-16 h-16 flex-shrink-0 bg-slate-100 rounded-lg overflow-hidden">
                      {isImage(file.mime_type) ? (
                        <img
                          src={file.urls.thumbnail}
                          alt={file.original_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* 文件信息 */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">{file.original_name}</p>
                      <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                        <span>{formatFileSize(file.file_size)}</span>
                        {file.width && file.height && (
                          <span>{file.width} × {file.height}</span>
                        )}
                        <span>{formatDate(file.created_at)}</span>
                      </div>
                      {file.post && (
                        <Link
                          href={`/editor/${file.post.id}`}
                          prefetch={false}
                          className="text-sm text-blue-500 hover:underline mt-1 inline-block"
                        >
                          关联文章: {file.post.title || '无标题'}
                        </Link>
                      )}
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex items-center gap-2">
                      <a
                        href={file.urls.original}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 text-sm border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
                      >
                        查看
                      </a>
                      <button
                        onClick={() => handleDelete(file.id)}
                        disabled={deleting === file.id}
                        className="px-3 py-1 text-sm text-red-600 border border-red-200 rounded-md hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        {deleting === file.id ? '删除中...' : '删除'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 分页 */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-200 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 text-sm border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  上一页
                </button>
                <span className="text-sm text-slate-500">
                  第 {page} / {totalPages} 页
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 text-sm border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  下一页
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="p-8 text-center text-slate-500">
            <p>还没有上传任何文件</p>
            <Link
              href="/editor/new"
              className="text-blue-500 hover:underline mt-2 inline-block"
            >
              去写文章并上传图片
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
