import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import ShareContent from '@/components/viewer/ShareContent'
import CommentSection from '@/components/comments/CommentSection'

interface PageProps {
  params: Promise<{ shortCode: string }>
}

export default async function SharePage({ params }: PageProps) {
  const { shortCode } = await params
  const supabase = await createClient()

  // 获取文章
  const { data: post, error } = await supabase
    .from('mdshare_posts')
    .select(`
      *,
      mdshare_profiles (
        username,
        display_name,
        avatar_url
      )
    `)
    .eq('short_code', shortCode)
    .eq('status', 'published')
    .single()

  if (error || !post) {
    notFound()
  }

  // 检查是否过期
  if (post.expires_at && new Date(post.expires_at) < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2 text-slate-900">链接已过期</h1>
          <p className="text-slate-500">此分享链接已失效</p>
        </div>
      </div>
    )
  }

  // 记录访问日志
  const headersList = await headers()
  const userAgent = headersList.get('user-agent') || ''
  const referer = headersList.get('referer') || ''

  await supabase.from('mdshare_access_logs').insert({
    post_id: post.id,
    user_agent: userAgent,
    referer: referer,
  })

  // 更新浏览次数
  await supabase
    .from('mdshare_posts')
    .update({ view_count: (post.view_count || 0) + 1 })
    .eq('id', post.id)

  // 获取评论
  const { data: comments } = await supabase
    .from('mdshare_comments')
    .select('id, guest_name, content, created_at')
    .eq('post_id', post.id)
    .eq('is_approved', true)
    .order('created_at', { ascending: false })

  const profile = post.mdshare_profiles as { username: string; display_name: string | null; avatar_url: string | null } | null

  return (
    <div className="min-h-screen bg-white">
      <article className="max-w-3xl mx-auto px-4 py-12">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-4 text-slate-900">{post.title}</h1>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            {profile && (
              <span>
                作者: {profile.display_name || profile.username}
              </span>
            )}
            <span>
              {new Date(post.created_at).toLocaleDateString('zh-CN')}
            </span>
            <span>{post.view_count} 次浏览</span>
          </div>
        </header>

        <div className="prose prose-slate max-w-none">
          <ShareContent content={post.content} />
        </div>

        <CommentSection postId={post.id} initialComments={comments || []} />

        <footer className="mt-12 pt-8 border-t border-slate-200">
          <p className="text-sm text-slate-500 text-center">
            由 <a href="/" className="text-blue-600 hover:underline">MDShare</a> 提供支持
          </p>
        </footer>
      </article>
    </div>
  )
}
