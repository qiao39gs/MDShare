import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/auth/login - 用户登录
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: '邮箱和密码不能为空' }, { status: 400 })
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      const message = error.message === 'Invalid login credentials'
        ? '邮箱或密码错误'
        : error.message
      return NextResponse.json({ error: message }, { status: 401 })
    }

    return NextResponse.json({ data: { user: data.user } })
  } catch (error) {
    console.error('API 错误:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
