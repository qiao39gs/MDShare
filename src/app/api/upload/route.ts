import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { filename, originalName, cosKey, fileSize, mimeType, width, height, postId } = body

    // 检查存储配额
    const { data: profile } = await supabase
      .from('mdshare_profiles')
      .select('storage_used, storage_limit')
      .eq('id', user.id)
      .single()

    if (profile && profile.storage_used + fileSize > profile.storage_limit) {
      return NextResponse.json({ error: '存储空间不足' }, { status: 403 })
    }

    // 记录文件信息
    const { data: file, error: fileError } = await supabase
      .from('mdshare_files')
      .insert({
        user_id: user.id,
        post_id: postId || null,
        filename,
        original_name: originalName,
        cos_key: cosKey,
        file_size: fileSize,
        mime_type: mimeType,
        width: width || null,
        height: height || null,
      })
      .select()
      .single()

    if (fileError) {
      return NextResponse.json({ error: fileError.message }, { status: 500 })
    }

    // 更新用户存储使用量
    await supabase
      .from('mdshare_profiles')
      .update({
        storage_used: (profile?.storage_used || 0) + fileSize,
      })
      .eq('id', user.id)

    // 生成访问 URL
    const bucket = process.env.COS_BUCKET_NAME
    const region = process.env.COS_REGION || 'ap-beijing'
    const baseUrl = `https://${bucket}.cos.${region}.myqcloud.com`

    // 压缩图片 URL（通过数据万象）
    const compressedUrl = `${baseUrl}${cosKey}?imageMogr2/format/webp/quality/80`
    // 原图 URL
    const originalUrl = `${baseUrl}${cosKey}`

    return NextResponse.json({
      file,
      urls: {
        compressed: compressedUrl,
        original: originalUrl,
        thumbnail: `${baseUrl}${cosKey}?imageMogr2/thumbnail/300x300`,
      },
    })
  } catch (error) {
    console.error('上传记录失败:', error)
    return NextResponse.json({ error: '上传失败' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get('id')

    if (!fileId) {
      return NextResponse.json({ error: '缺少文件 ID' }, { status: 400 })
    }

    // 获取文件信息
    const { data: file } = await supabase
      .from('mdshare_files')
      .select('*')
      .eq('id', fileId)
      .eq('user_id', user.id)
      .single()

    if (!file) {
      return NextResponse.json({ error: '文件不存在' }, { status: 404 })
    }

    // 删除文件记录
    const { error: deleteError } = await supabase
      .from('mdshare_files')
      .delete()
      .eq('id', fileId)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    // 更新用户存储使用量
    const { data: profile } = await supabase
      .from('mdshare_profiles')
      .select('storage_used')
      .eq('id', user.id)
      .single()

    await supabase
      .from('mdshare_profiles')
      .update({
        storage_used: Math.max(0, (profile?.storage_used || 0) - file.file_size),
      })
      .eq('id', user.id)

    // 注意：这里没有删除 COS 上的实际文件
    // 生产环境应该调用 COS API 删除文件

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('删除文件失败:', error)
    return NextResponse.json({ error: '删除失败' }, { status: 500 })
  }
}
