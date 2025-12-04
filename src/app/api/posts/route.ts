import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateShortCode } from '@/lib/utils/shortcode'

// POST /api/posts - 创建新文章
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const body = await request.json()
    const { title, content, status = 'draft' } = body

    if (!title?.trim()) {
      return NextResponse.json({ error: '标题不能为空' }, { status: 400 })
    }

    const shortCode = generateShortCode()

    const { data, error } = await supabase
      .from('mdshare_posts')
      .insert({
        user_id: user.id,
        title: title.trim(),
        content: content || '',
        short_code: shortCode,
        status,
      })
      .select()
      .single()

    if (error) {
      console.error('创建文章失败:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('API 错误:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
