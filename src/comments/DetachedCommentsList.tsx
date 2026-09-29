import { useState } from 'react'
import { useCommentsStore } from './commentsStore'

/**
 * Comments the four-step re-anchoring pass (idea.md §13) couldn't reliably place in the
 * current document. Kept and shown here rather than silently dropped, matching the
 * "detached comments should still remain accessible" requirement.
 */
export function DetachedCommentsList(): React.JSX.Element | null {
  const comments = useCommentsStore((s) => s.comments)
  const updateStatus = useCommentsStore((s) => s.updateCommentStatus)
  const [open, setOpen] = useState(false)

  const detached = comments.filter((c) => c.status === 'detached')
  if (detached.length === 0) return null

  return (
    <div className="detached-comments">
      <button onClick={() => setOpen((o) => !o)}>
        {detached.length} detached comment{detached.length === 1 ? '' : 's'}
      </button>
      {open && (
        <div className="detached-comments-list">
          {detached.map((c) => (
            <div key={c.id} className="comment-card">
              <div className="comment-card-meta">Detached — original passage:</div>
              <blockquote>{c.anchor.selectedText}</blockquote>
              <div className="comment-card-text">{c.comment}</div>
              <div className="comment-card-actions">
                <button onClick={() => void updateStatus(c.id, 'dismissed')}>Dismiss</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
