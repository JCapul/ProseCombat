import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import type { Editor } from '@tiptap/react'

export interface CommentPosition {
  id: string
  from: number
  to: number
}

interface DecorationPluginState {
  positions: Map<string, { from: number; to: number }>
  decorations: DecorationSet
}

export const commentDecorationPluginKey = new PluginKey<DecorationPluginState>('commentDecorations')

type Meta =
  | { type: 'setPositions'; positions: CommentPosition[] }
  | { type: 'addPositions'; positions: CommentPosition[] }
  | { type: 'removePositions'; ids: string[] }

/**
 * Renders inline highlight decorations for anchored comments and keeps their live
 * from/to positions up to date via ProseMirror's transaction mapping — the same
 * "annotation" pattern used by blockTrackingPlugin, so highlights stay correctly
 * placed as the user types around or before them without needing to re-run the
 * text-based re-anchoring pass on every keystroke (that only runs once per file load).
 */
export function createCommentDecorationPlugin(): Plugin<DecorationPluginState> {
  return new Plugin<DecorationPluginState>({
    key: commentDecorationPluginKey,
    state: {
      init() {
        return { positions: new Map(), decorations: DecorationSet.empty }
      },
      apply(tr, value, _oldState, newState) {
        const meta = tr.getMeta(commentDecorationPluginKey) as Meta | undefined
        let positions = value.positions

        if (meta?.type === 'setPositions') {
          positions = new Map(meta.positions.map((p) => [p.id, { from: p.from, to: p.to }]))
        } else if (meta?.type === 'addPositions') {
          positions = new Map(positions)
          for (const p of meta.positions) positions.set(p.id, { from: p.from, to: p.to })
        } else if (meta?.type === 'removePositions') {
          positions = new Map(positions)
          for (const id of meta.ids) positions.delete(id)
        } else if (tr.docChanged) {
          const next = new Map<string, { from: number; to: number }>()
          positions.forEach(({ from, to }, id) => {
            next.set(id, { from: tr.mapping.map(from, -1), to: tr.mapping.map(to, 1) })
          })
          positions = next
        } else {
          return value
        }

        const decos: Decoration[] = []
        positions.forEach(({ from, to }, id) => {
          if (from < to && to <= newState.doc.content.size) {
            decos.push(Decoration.inline(from, to, { class: 'comment-highlight', 'data-comment-id': id }))
          }
        })

        return { positions, decorations: DecorationSet.create(newState.doc, decos) }
      }
    },
    props: {
      decorations(state) {
        return commentDecorationPluginKey.getState(state)?.decorations
      }
    }
  })
}

export function getLivePositions(state: DecorationPluginState | undefined): CommentPosition[] {
  if (!state) return []
  return Array.from(state.positions.entries()).map(([id, { from, to }]) => ({ id, from, to }))
}

export function addCommentPositions(editor: Editor, positions: CommentPosition[]): void {
  const tr = editor.state.tr.setMeta(commentDecorationPluginKey, { type: 'addPositions', positions })
  editor.view.dispatch(tr)
}

export function removeCommentPositions(editor: Editor, ids: string[]): void {
  const tr = editor.state.tr.setMeta(commentDecorationPluginKey, { type: 'removePositions', ids })
  editor.view.dispatch(tr)
}
