import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/auth/register - 用户注册
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { username, email, password } = body

    // 验证输入
    if (!username || username.length < 3) {
      return NextResponse.json({ error: '用户名长度至少为 3 位' }, { status: 400 })
    }

    if (!email) {
      return NextResponse.json({ error: '邮箱不能为空' }, { status: 400 })
    }

    if (!password || password.length < 6) {
      return NextResponse.json({ error: '密码长度至少为 6 位' }, { status: 400 })
    }

    // 检查用户名是否已存在
    const { data: existingUsers } = await supabase
      .from('mdshare_profiles')
      .select('username')
      .eq('username', username)
      .limit(1)

    if (existingUsers && existingUsers.length > 0) {
      return NextResponse.json({ error: '该用户名已被使用' }, { status: 400 })
    }

    // 注册用户
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
      },
    })

    if (error) {
      console.error('注册失败:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data: { user: data.user } })
  } catch (error) {
    console.error('API 错误:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
