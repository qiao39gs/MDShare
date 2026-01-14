import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // 获取文件总数
    const { count } = await supabase
      .from('mdshare_files')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    // 获取文件列表
    const { data: files, error } = await supabase
      .from('mdshare_files')
      .select(`
        *,
        post:mdshare_posts(id, title, short_code)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 生成文件 URL
    const bucket = process.env.COS_BUCKET_NAME
    const region = process.env.COS_REGION || 'ap-beijing'
    const baseUrl = `https://${bucket}.cos.${region}.myqcloud.com`

    const filesWithUrls = files?.map(file => ({
      ...file,
      urls: {
        original: `${baseUrl}${file.cos_key}`,
        thumbnail: `${baseUrl}${file.cos_key}?imageMogr2/thumbnail/200x200`,
        compressed: `${baseUrl}${file.cos_key}?imageMogr2/format/webp/quality/80`,
      }
    }))

    return NextResponse.json({
      files: filesWithUrls,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      }
    })
  } catch (error) {
    console.error('获取文件列表失败:', error)
    return NextResponse.json({ error: '获取失败' }, { status: 500 })
  }
}
