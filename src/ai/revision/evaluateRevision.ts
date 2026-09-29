import type { Editor } from '@tiptap/react'
import type { Comment } from '@shared/types/comments'
import { api } from '../../ipcClient/api'
import { useCommentsStore } from '../../comments/commentsStore'
import { commentDecorationPluginKey, getLivePositions } from '../../comments/anchoring/decorationPlugin'

/**
 * "Evaluate revision" (idea.md §8). The immutable original passage/comment come from
 * the comment's own snapshot; the revised passage is read from the LIVE document at the
 * comment's current (possibly re-anchored) position. The actual fresh-context guarantee
 * lives one layer down, in AnthropicProvider.compare()'s signature — this function just
 * gathers the three plain strings that method accepts and nothing else.
 */
export async function evaluateRevision(editor: Editor, comment: Comment): Promise<void> {
  const positions = getLivePositions(commentDecorationPluginKey.getState(editor.state))
  const live = positions.find((p) => p.id === comment.id)
  if (!live) {
    throw new Error('This comment is detached and has no current position to evaluate against.')
  }

  const revisedPassage = editor.state.doc.textBetween(live.from, live.to, '\n', '\n')

  const result = await api.llm.compare({
    originalPassage: comment.anchor.selectedText,
    originalComment: comment.comment,
    revisedPassage
  })

  await useCommentsStore.getState().addRevisionEvaluation({
    commentId: comment.id,
    evaluatedAt: new Date().toISOString(),
    originalPassage: comment.anchor.selectedText,
    originalComment: comment.comment,
    revisedPassage,
    resolved: result.resolved,
    explanation: result.explanation,
    newIssues: result.newIssues
  })
}
