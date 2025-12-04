'use client'

import { useState, useEffect, useCallback } from 'react'
import CommentForm from './CommentForm'
import CommentList from './CommentList'

interface Comment {
  id: string
  guest_name: string | null
  content: string
  created_at: string
}

interface CommentSectionProps {
  postId: string
  initialComments: Comment[]
}

export default function CommentSection({ postId, initialComments }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments)

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/comments?post_id=${postId}`)
      if (res.ok) {
        const data = await res.json()
        setComments(data.comments)
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error)
    }
  }, [postId])

  useEffect(() => {
    setComments(initialComments)
  }, [initialComments])

  return (
    <section className="mt-12 pt-8 border-t border-slate-200">
      <h2 className="text-xl font-bold text-slate-900 mb-6">
        评论 ({comments.length})
      </h2>

      <div className="mb-8">
        <CommentForm postId={postId} onCommentAdded={fetchComments} />
      </div>

      <CommentList comments={comments} />
    </section>
  )
}
