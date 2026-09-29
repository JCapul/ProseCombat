import type { Editor } from '@tiptap/react'
import type { CritiqueCategory } from '@shared/types/comments'
import { api } from '../../platform/api'
import { useCommentsStore } from '../../comments/commentsStore'
import { addCommentPositions } from '../../comments/anchoring/decorationPlugin'

export interface RunCritiqueResult {
  addedCount: number
  withheldCount: number
}

/**
 * Runs a critique over either the whole document or the current selection, and turns
 * the (validated, filtered — see providers/anthropic and shared/critique/rewriteHeuristic
 * on the main-process side) result into persisted Comment objects anchored against the
 * live document text.
 */
export async function runCritique(editor: Editor, mode: CritiqueCategory): Promise<RunCritiqueResult> {
  const { from, to, empty } = editor.state.selection
  const useSelection = !empty
  const docText = editor.state.doc.textBetween(0, editor.state.doc.content.size, '\n', '\n')

  const selectionText = useSelection ? editor.state.doc.textBetween(from, to, '\n', '\n') : docText
  const offset = useSelection ? from : 0

  const response = await api.llm.critique({
    documentText: selectionText,
    selectionRange: useSelection ? { start: from, end: to } : undefined,
    mode
  })

  const commentsWithAbsoluteOffsets = response.comments.map((c) => ({
    ...c,
    start: c.start + offset,
    end: c.end + offset
  }))

  const created = await useCommentsStore.getState().addComments(commentsWithAbsoluteOffsets, docText)
  addCommentPositions(
    editor,
    created.map((c) => ({ id: c.id, from: c.anchor.start, to: c.anchor.end }))
  )

  return { addedCount: created.length, withheldCount: response.withheldCount }
}
