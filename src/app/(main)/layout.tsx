import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="max-w-6xl mx-auto px-4 flex h-14 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="font-bold text-xl text-slate-900">
              MDShare
            </Link>
            <nav className="hidden md:flex items-center gap-4 text-sm">
              <Link href="/dashboard" className="text-slate-500 hover:text-slate-900 transition-colors">
                控制台
              </Link>
              <Link href="/editor/new" className="text-slate-500 hover:text-slate-900 transition-colors">
                新建文章
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <form action="/api/auth/signout" method="post">
                <button
                  type="submit"
                  className="text-sm text-slate-500 hover:text-slate-900 transition-colors"
                >
                  退出登录
                </button>
              </form>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
