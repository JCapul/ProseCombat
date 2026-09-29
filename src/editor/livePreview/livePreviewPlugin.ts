import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import type { EditorState } from '@tiptap/pm/state'
import type { Node as PMNode, Mark, MarkType, ResolvedPos } from '@tiptap/pm/model'

export const livePreviewPluginKey = new PluginKey<DecorationSet>('livePreview')

function widgetAt(pos: number, text: string, side: -1 | 1): Decoration {
  const span = document.createElement('span')
  span.className = 'md-syntax'
  span.textContent = text
  return Decoration.widget(pos, span, {
    side,
    // Without this, ProseMirror strictly pins the cursor to the `side` of the widget
    // it's on when the caret sits exactly at this position — e.g. a trailing closing
    // marker (side: 1) would keep the cursor before it rather than letting it move on.
    ignoreSelection: true,
    // Without a stable key, ProseMirror compares widget identity by DOM node
    // reference — since a fresh <span> is created on every decoration rebuild (i.e.
    // on every selection change), it never recognizes "the same widget" across
    // redraws and always tears down and recreates the DOM node. That churn, right
    // at the DOM position the native caret is anchored to, is what was resetting
    // the cursor back to the wrong side instead of letting it settle where the
    // browser actually placed it.
    key: `md-syntax:${pos}:${side}:${text}`
  })
}

interface Span {
  from: number
  to: number
  node: PMNode
}

/**
 * Expands from `pos` to the full contiguous run carrying an equal mark of `type`,
 * by scanning the parent's actual child nodes rather than walking position-by-position
 * with ResolvedPos.marks(). The latter uses "marks a newly typed character would carry"
 * semantics, which are ambiguous exactly at a mark's start/end boundary (it resolves to
 * the marks of the node *before* the boundary) — that ambiguity previously placed the
 * opening syntax widget one character inside the mark instead of before it. Working
 * from the actual per-child mark set sidesteps that: when `pos` sits on the boundary
 * between an unmarked and a marked child, the marked child wins.
 */
function expandMarkRange(doc: PMNode, pos: number, type: MarkType): { from: number; to: number; mark: Mark } | null {
  const $pos = doc.resolve(pos)
  const parent = $pos.parent
  const parentStart = $pos.start()

  const children: Span[] = []
  parent.forEach((node, offset) => {
    children.push({ from: parentStart + offset, to: parentStart + offset + node.nodeSize, node })
  })

  const touching = children.filter((c) => pos >= c.from && pos <= c.to)
  const withMark = touching.find((c) => type.isInSet(c.node.marks))
  if (!withMark) return null
  const mark = type.isInSet(withMark.node.marks)
  if (!mark) return null

  let from = withMark.from
  let to = withMark.to
  let i = children.indexOf(withMark)

  while (i > 0) {
    const prevMark = type.isInSet(children[i - 1].node.marks)
    if (!prevMark || !prevMark.eq(mark)) break
    from = children[i - 1].from
    i--
  }

  i = children.indexOf(withMark)
  while (i < children.length - 1) {
    const nextMark = type.isInSet(children[i + 1].node.marks)
    if (!nextMark || !nextMark.eq(mark)) break
    to = children[i + 1].to
    i++
  }

  return { from, to, mark }
}

const INLINE_MARK_SYNTAX: { type: string; open: (mark: Mark) => string; close: (mark: Mark) => string }[] = [
  { type: 'code', open: () => '`', close: () => '`' },
  { type: 'bold', open: () => '**', close: () => '**' },
  { type: 'italic', open: () => '*', close: () => '*' },
  {
    type: 'link',
    open: () => '[',
    close: (mark) => `](${(mark.attrs as { href?: string }).href ?? ''})`
  }
]

function blockMarkerWidget($pos: ResolvedPos): { pos: number; text: string } | null {
  const parent = $pos.parent
  const depth = $pos.depth
  const parentStart = $pos.start()

  if (parent.type.name === 'heading') {
    const level = (parent.attrs as { level?: number }).level ?? 1
    return { pos: parentStart, text: `${'#'.repeat(level)} ` }
  }

  if (parent.type.name !== 'paragraph' || depth < 2) return null

  // Note: list items deliberately have no marker reveal here — the browser's
  // native <ul>/<ol> bullet/number rendering already shows that information;
  // adding a synthetic "- "/"1. " widget on top of it just duplicates it.
  const grandParent = $pos.node(depth - 1)
  if (!grandParent) return null

  if (grandParent.type.name === 'blockquote') {
    return { pos: parentStart, text: '> ' }
  }

  return null
}

function buildDecorations(state: EditorState): DecorationSet {
  if (!state.selection.empty) return DecorationSet.empty
  const pos = state.selection.from
  const decos: Decoration[] = []

  const blockWidget = blockMarkerWidget(state.doc.resolve(pos))
  if (blockWidget) {
    decos.push(widgetAt(blockWidget.pos, blockWidget.text, -1))
  }

  for (const spec of INLINE_MARK_SYNTAX) {
    const markType = state.schema.marks[spec.type]
    if (!markType) continue
    const range = expandMarkRange(state.doc, pos, markType)
    if (!range) continue
    decos.push(widgetAt(range.from, spec.open(range.mark), -1))
    decos.push(widgetAt(range.to, spec.close(range.mark), 1))
  }

  return DecorationSet.create(state.doc, decos)
}

/**
 * Obsidian-style "live preview": markdown syntax markers (## heading, **bold**,
 * *italic*, `code`, [link](url), list/blockquote markers) stay hidden everywhere
 * except around the current cursor position, where they're revealed as small
 * inline widgets so the raw formatting is visible and directly editable. Purely
 * visual — these widgets are never part of the document, so they can't affect
 * serialization or the minimal-diff save path.
 */
export function createLivePreviewPlugin(): Plugin<DecorationSet> {
  return new Plugin<DecorationSet>({
    key: livePreviewPluginKey,
    state: {
      init(_config, state) {
        return buildDecorations(state)
      },
      apply(tr, _value, _oldState, newState) {
        if (!tr.docChanged && !tr.selectionSet) return _value
        return buildDecorations(newState)
      }
    },
    props: {
      decorations(state) {
        return livePreviewPluginKey.getState(state)
      }
    }
  })
}

