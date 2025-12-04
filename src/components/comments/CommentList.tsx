'use client'

import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface Comment {
  id: string
  guest_name: string | null
  content: string
  created_at: string
}

interface CommentListProps {
  comments: Comment[]
}

export default function CommentList({ comments }: CommentListProps) {
  if (comments.length === 0) {
    return (
      <p className="text-slate-500 text-center py-8">
        暂无评论，来发表第一条评论吧！
      </p>
    )
  }

  return (
    <div className="space-y-6">
      {comments.map((comment) => (
        <div key={comment.id} className="border-b border-slate-100 pb-6 last:border-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-medium text-sm">
              {(comment.guest_name || '匿名')[0].toUpperCase()}
            </div>
            <div>
              <span className="font-medium text-slate-900">
                {comment.guest_name || '匿名'}
              </span>
              <span className="text-slate-400 text-sm ml-2">
                {formatDistanceToNow(new Date(comment.created_at), {
                  addSuffix: true,
                  locale: zhCN,
                })}
              </span>
            </div>
          </div>
          <p className="text-slate-700 whitespace-pre-wrap pl-11">
            {comment.content}
          </p>
        </div>
      ))}
    </div>
  )
}
