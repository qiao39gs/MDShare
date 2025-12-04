import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

// COS 临时凭证生成
// 注意：生产环境应使用腾讯云 STS 服务获取临时凭证
// 这里提供一个简化版本，实际使用时需要替换为 STS 调用

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  // 检查用户存储配额
  const { data: profile } = await supabase
    .from('mdshare_profiles')
    .select('storage_used, storage_limit')
    .eq('id', user.id)
    .single()

  if (profile && profile.storage_used >= profile.storage_limit) {
    return NextResponse.json({ error: '存储空间已满' }, { status: 403 })
  }

  const secretId = process.env.COS_SECRETID
  const secretKey = process.env.COS_SECRETKEY
  const bucket = process.env.COS_BUCKET_NAME
  const region = process.env.COS_REGION || 'ap-beijing'

  if (!secretId || !secretKey || !bucket) {
    return NextResponse.json({ error: 'COS 配置缺失' }, { status: 500 })
  }

  // 生成上传路径
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const uploadPath = `/mdshare/${user.id}/${year}/${month}/`

  // 生成签名（简化版，生产环境应使用 STS）
  const expireTime = Math.floor(Date.now() / 1000) + 1800 // 30分钟有效期
  const keyTime = `${Math.floor(Date.now() / 1000)};${expireTime}`

  const signKey = crypto
    .createHmac('sha1', secretKey)
    .update(keyTime)
    .digest('hex')

  return NextResponse.json({
    bucket,
    region,
    uploadPath,
    credentials: {
      secretId,
      secretKey, // 注意：生产环境不应直接返回 secretKey，应使用 STS 临时凭证
      expireTime,
      keyTime,
      signKey,
    },
  })
}
