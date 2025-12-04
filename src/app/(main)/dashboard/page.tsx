import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 获取用户文章
  const { data: posts } = await supabase
    .from('mdshare_posts')
    .select('*')
    .eq('user_id', user?.id)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })

  // 获取用户资料
  const { data: profile } = await supabase
    .from('mdshare_profiles')
    .select('*')
    .eq('id', user?.id)
    .single()

  const formatDate = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: zhCN })
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-yellow-100 text-yellow-800',
      published: 'bg-green-100 text-green-800',
      archived: 'bg-gray-100 text-gray-800',
    }
    const labels: Record<string, string> = {
      draft: '草稿',
      published: '已发布',
      archived: '已归档',
    }
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${styles[status] || styles.draft}`}>
        {labels[status] || status}
      </span>
    )
  }

  const storageUsedMB = ((profile?.storage_used || 0) / 1024 / 1024).toFixed(2)
  const storageLimitMB = ((profile?.storage_limit || 524288000) / 1024 / 1024).toFixed(0)
  const storagePercent = ((profile?.storage_used || 0) / (profile?.storage_limit || 524288000) * 100).toFixed(1)

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">控制台</h1>
          <p className="text-slate-500 mt-1">
            欢迎回来，{profile?.display_name || profile?.username || '用户'}
          </p>
        </div>
        <Link
          href="/editor/new"
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          新建文章
        </Link>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-sm font-medium text-slate-500">文章总数</h3>
          <p className="text-3xl font-bold mt-2 text-slate-900">{posts?.length || 0}</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-sm font-medium text-slate-500">已发布</h3>
          <p className="text-3xl font-bold mt-2 text-slate-900">
            {posts?.filter(p => p.status === 'published').length || 0}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-sm font-medium text-slate-500">存储空间</h3>
          <p className="text-xl font-bold mt-2 text-slate-900">{storageUsedMB} / {storageLimitMB} MB</p>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-2">
            <div
              className="bg-blue-500 h-2 rounded-full"
              style={{ width: `${Math.min(parseFloat(storagePercent), 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 文章列表 */}
      <div className="bg-white rounded-lg border border-slate-200">
        <div className="p-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-900">我的文章</h2>
        </div>
        {posts && posts.length > 0 ? (
          <div className="divide-y divide-slate-200">
            {posts.map((post) => (
              <div key={post.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/editor/${post.id}`}
                        className="font-medium text-slate-900 hover:text-blue-500 truncate"
                      >
                        {post.title || '无标题'}
                      </Link>
                      {post.is_pinned && (
                        <span className="text-xs text-orange-500">置顶</span>
                      )}
                      {getStatusBadge(post.status)}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                      <span>更新于 {formatDate(post.updated_at)}</span>
                      <span>{post.view_count} 次浏览</span>
                      {post.status === 'published' && (
                        <Link
                          href={`/s/${post.short_code}`}
                          className="text-blue-500 hover:underline"
                          target="_blank"
                        >
                          查看
                        </Link>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Link
                      href={`/editor/${post.id}`}
                      className="px-3 py-1 text-sm border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
                    >
                      编辑
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500">
            <p>还没有文章</p>
            <Link
              href="/editor/new"
              className="text-blue-500 hover:underline mt-2 inline-block"
            >
              创建第一篇文章
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
