import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-slate-300">404</h1>
        <h2 className="text-2xl font-semibold mt-4 text-slate-900">页面未找到</h2>
        <p className="text-slate-500 mt-2">
          您访问的页面不存在或已被删除
        </p>
        <Link
          href="/"
          className="inline-block mt-6 px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          返回首页
        </Link>
      </div>
    </div>
  )
}
