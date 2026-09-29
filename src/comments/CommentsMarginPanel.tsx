import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { Editor } from '@tiptap/react'
import type { Comment } from '@shared/types/comments'
import { commentDecorationPluginKey, getLivePositions, removeCommentPositions } from './anchoring/decorationPlugin'
import { useCommentsStore } from './commentsStore'
import { evaluateRevision } from '../ai/revision/evaluateRevision'
import { resolveOverlaps } from './marginLayout'

interface MarginEntry {
  id: string
  anchorTop: number
  comment: Comment
}

function computeEntries(editor: Editor, comments: Comment[]): MarginEntry[] {
  const positions = getLivePositions(commentDecorationPluginKey.getState(editor.state))
  const byId = new Map(comments.map((c) => [c.id, c]))
  const entries: MarginEntry[] = []
  for (const pos of positions) {
    const comment = byId.get(pos.id)
    if (!comment || comment.status !== 'active') continue
    try {
      const coords = editor.view.coordsAtPos(pos.to)
      entries.push({ id: pos.id, anchorTop: coords.top, comment })
    } catch {
      // position temporarily out of range mid-transaction; skip this render
    }
  }
  return entries.sort((a, b) => a.anchorTop - b.anchorTop)
}

const CATEGORY_LABEL: Record<Comment['category'], string> = {
  general: 'General',
  argument: 'Argument',
  structure: 'Structure',
  prose: 'Prose'
}

export function CommentsMarginPanel({ editor }: { editor: Editor | null }): React.JSX.Element | null {
  const comments = useCommentsStore((s) => s.comments)
  const updateStatus = useCommentsStore((s) => s.updateCommentStatus)
  const revisions = useCommentsStore((s) => s.revisions)
  const [entries, setEntries] = useState<MarginEntry[]>([])
  const [evaluatingId, setEvaluatingId] = useState<string | null>(null)
  const [evalError, setEvalError] = useState<string | null>(null)
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  useEffect(() => {
    if (!editor) return
    const recompute = (): void => setEntries(computeEntries(editor, comments))
    recompute()
    editor.on('transaction', recompute)
    return () => {
      editor.off('transaction', recompute)
    }
  }, [editor, comments])

  // Measure actual card heights after each render of `entries` and resolve
  // overlaps against them, writing the corrected `top` straight to the DOM
  // (not through React state) so this doesn't trigger a second render pass —
  // useLayoutEffect still runs before paint, so there's no visible flash.
  useLayoutEffect(() => {
    const heights = new Map<string, number>()
    for (const entry of entries) {
      const el = cardRefs.current.get(entry.id)
      if (el) heights.set(entry.id, el.offsetHeight)
    }
    const tops = resolveOverlaps(entries, heights)
    for (const entry of entries) {
      const el = cardRefs.current.get(entry.id)
      const top = tops.get(entry.id)
      if (el && top !== undefined) el.style.top = `${top}px`
    }
  }, [entries])

  if (!editor) return null

  const handleEvaluate = async (comment: Comment): Promise<void> => {
    setEvaluatingId(comment.id)
    setEvalError(null)
    try {
      await evaluateRevision(editor, comment)
    } catch (err) {
      setEvalError(err instanceof Error ? err.message : String(err))
    } finally {
      setEvaluatingId(null)
    }
  }

  const handleStatusChange = async (id: string, status: 'resolved' | 'dismissed'): Promise<void> => {
    // The highlight decoration is tracked independently of comment status (see
    // decorationPlugin.ts) so it survives edits within a session — which means
    // it also has to be explicitly removed here, or it just sits there forever
    // pointing at a comment nothing shows anymore.
    removeCommentPositions(editor, [id])
    await updateStatus(id, status)
  }

  return (
    <div className="comments-margin">
      {entries.map((entry) => {
        const commentRevisions = revisions.filter((r) => r.commentId === entry.id)
        const latest = commentRevisions[commentRevisions.length - 1]
        return (
          <div
            key={entry.id}
            ref={(el) => {
              if (el) cardRefs.current.set(entry.id, el)
              else cardRefs.current.delete(entry.id)
            }}
            className="comment-card"
            style={{ top: entry.anchorTop }}
          >
            <div className="comment-card-meta">
              <span className={`severity-dot severity-${entry.comment.severity}`} />
              {CATEGORY_LABEL[entry.comment.category]}
            </div>
            <div className="comment-card-text">{entry.comment.comment}</div>
            {latest && (
              <div className="revision-verdict">
                <strong>{latest.resolved ? '✓ Issue resolved' : '✗ Not resolved'}</strong>
                <p>{latest.explanation}</p>
                {latest.newIssues.length > 0 && (
                  <ul>
                    {latest.newIssues.map((issue, i) => (
                      <li key={i}>{issue}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {evalError && evaluatingId === null && <div className="comment-card-error">{evalError}</div>}
            <div className="comment-card-actions">
              <button onClick={() => void handleEvaluate(entry.comment)} disabled={evaluatingId === entry.id}>
                {evaluatingId === entry.id ? 'Evaluating…' : 'Evaluate revision'}
              </button>
              <button onClick={() => void handleStatusChange(entry.id, 'resolved')}>Resolve</button>
              <button onClick={() => void handleStatusChange(entry.id, 'dismissed')}>Dismiss</button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
