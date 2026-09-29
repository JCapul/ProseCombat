import type { Editor } from '@tiptap/react'
import type { Comment } from '@shared/types/comments'
import { reanchorAllComments } from './reanchor'
import { commentDecorationPluginKey, type CommentPosition } from './decorationPlugin'

export interface ReanchorOutcome {
  updatedComments: Comment[]
  positions: CommentPosition[]
}

/**
 * Runs the four-step re-anchoring pass against the editor's current document and pushes
 * the resulting live positions into the decoration plugin. Called once right after a
 * file (and its sidecar comments) finishes loading, before first paint of the comments
 * panel, so there's no flash of stale or wrongly-placed margin markers.
 */
export function applyReanchoring(editor: Editor, comments: Comment[]): ReanchorOutcome {
  const results = reanchorAllComments(comments, editor.state.doc)
  const positions: CommentPosition[] = []
  const updatedComments: Comment[] = results.map(({ comment, from, to }) => {
    if (comment.status === 'active' && from !== undefined && to !== undefined) {
      positions.push({ id: comment.id, from, to })
    }
    return comment
  })

  const tr = editor.state.tr.setMeta(commentDecorationPluginKey, { type: 'setPositions', positions })
  editor.view.dispatch(tr)

  return { updatedComments, positions }
}
