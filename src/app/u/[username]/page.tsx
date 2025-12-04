import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface PageProps {
  params: Promise<{ username: string }>
}

export default async function UserPage({ params }: PageProps) {
  const { username } = await params
  const supabase = await createClient()

  // 获取用户资料
  const { data: profile, error: profileError } = await supabase
    .from('mdshare_profiles')
    .select('*')
    .eq('username', username)
    .single()

  if (profileError || !profile) {
    notFound()
  }

  // 获取用户公开文章
  const { data: posts } = await supabase
    .from('mdshare_posts')
    .select('*')
    .eq('user_id', profile.id)
    .eq('status', 'published')
    .eq('access_type', 'public')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })

  const formatDate = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: zhCN })
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* 用户信息 */}
        <header className="mb-12 text-center">
          {profile.avatar_url && (
            <img
              src={profile.avatar_url}
              alt={profile.display_name || profile.username}
              className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
            />
          )}
          <h1 className="text-2xl font-bold text-slate-900">
            {profile.display_name || profile.username}
          </h1>
          <p className="text-slate-500 mt-1">@{profile.username}</p>
          {profile.bio && (
            <p className="mt-4 text-slate-500 max-w-md mx-auto">
              {profile.bio}
            </p>
          )}
        </header>

        {/* 文章列表 */}
        <section>
          <h2 className="text-lg font-semibold mb-6 text-slate-900">
            文章 ({posts?.length || 0})
          </h2>

          {posts && posts.length > 0 ? (
            <div className="space-y-6">
              {posts.map((post) => (
                <article
                  key={post.id}
                  className="border border-slate-200 rounded-lg p-6 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        {post.is_pinned && (
                          <span className="text-xs text-orange-500 font-medium">
                            置顶
                          </span>
                        )}
                        <Link
                          href={`/s/${post.short_code}`}
                          className="text-lg font-medium text-slate-900 hover:text-blue-500 transition-colors"
                        >
                          {post.title}
                        </Link>
                      </div>
                      <p className="text-sm text-slate-500 mt-2">
                        {post.content.slice(0, 150)}
                        {post.content.length > 150 && '...'}
                      </p>
                      <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
                        <span>{formatDate(post.created_at)}</span>
                        <span>{post.view_count} 次浏览</span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <p>暂无公开文章</p>
            </div>
          )}
        </section>

        <footer className="mt-12 pt-8 border-t border-slate-200 text-center">
          <p className="text-sm text-slate-500">
            由 <Link href="/" className="text-blue-600 hover:underline">MDShare</Link> 提供支持
          </p>
        </footer>
      </div>
    </div>
  )
}
