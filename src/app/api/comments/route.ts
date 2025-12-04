import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const postId = searchParams.get('post_id')

  if (!postId) {
    return NextResponse.json({ error: '缺少 post_id 参数' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: comments, error } = await supabase
    .from('mdshare_comments')
    .select('id, guest_name, content, created_at')
    .eq('post_id', postId)
    .eq('is_approved', true)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: '获取评论失败' }, { status: 500 })
  }

  return NextResponse.json({ comments })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { post_id, guest_name, content } = body

    if (!post_id || !guest_name || !content) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 })
    }

    if (guest_name.length > 50) {
      return NextResponse.json({ error: '名字不能超过50个字符' }, { status: 400 })
    }

    if (content.length > 1000) {
      return NextResponse.json({ error: '评论内容不能超过1000个字符' }, { status: 400 })
    }

    const supabase = await createClient()

    // 验证文章是否存在且已发布
    const { data: post, error: postError } = await supabase
      .from('mdshare_posts')
      .select('id')
      .eq('id', post_id)
      .eq('status', 'published')
      .single()

    if (postError || !post) {
      return NextResponse.json({ error: '文章不存在或未发布' }, { status: 404 })
    }

    // 插入评论
    const { data: comment, error } = await supabase
      .from('mdshare_comments')
      .insert({
        post_id,
        guest_name,
        content,
        is_approved: true,
      })
      .select('id, guest_name, content, created_at')
      .single()

    if (error) {
      console.error('Insert comment error:', error)
      return NextResponse.json({ error: '评论提交失败' }, { status: 500 })
    }

    return NextResponse.json({ comment })
  } catch {
    return NextResponse.json({ error: '请求处理失败' }, { status: 500 })
  }
}
