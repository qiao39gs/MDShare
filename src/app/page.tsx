import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-white">
      <div className="max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl text-slate-900">
          MDShare
        </h1>
        <p className="mt-6 text-lg leading-8 text-slate-500">
          一个简洁优雅的 Markdown 内容分享平台。
          支持实时预览、代码高亮、数学公式、流程图等丰富功能。
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Link
            href="/login"
            className="rounded-md bg-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 transition-colors"
          >
            开始使用
          </Link>
          <Link
            href="/register"
            className="text-sm font-semibold leading-6 text-slate-900 hover:text-blue-500 transition-colors"
          >
            注册账号 <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </main>
  )
}
