import { useEffect, useState } from 'react'
import type { Editor } from '@tiptap/react'

interface PopoverState {
  href: string
  top: number
  left: number
}

/**
 * The live-preview reveal (see livePreview/livePreviewPlugin.ts) shows a link's
 * `[text](url)` syntax as decorative widgets when the cursor is inside it — but
 * widgets are read-only, so that only lets the visible text be edited (as normal
 * document content) and never the URL, which lives in the link mark's `href`
 * attribute and has no editable text representation at all. This popover is the
 * actual edit affordance for that attribute: a small field that appears next to
 * the link while the cursor is inside it.
 */
export function LinkEditPopover({ editor }: { editor: Editor | null }): React.JSX.Element | null {
  const [state, setState] = useState<PopoverState | null>(null)
  const [draft, setDraft] = useState('')

  useEffect(() => {
    if (!editor) return
    const recompute = (): void => {
      if (!editor.state.selection.empty || !editor.isActive('link')) {
        setState((prev) => (prev ? null : prev))
        return
      }
      const href = (editor.getAttributes('link').href as string | undefined) ?? ''
      const coords = editor.view.coordsAtPos(editor.state.selection.from)
      setState((prev) => {
        if (prev && prev.href === href && prev.top === coords.bottom + 6 && prev.left === coords.left) return prev
        return { href, top: coords.bottom + 6, left: coords.left }
      })
      setDraft((prevDraft) => (document.activeElement?.id === 'link-edit-url-input' ? prevDraft : href))
    }
    recompute()
    editor.on('transaction', recompute)
    return () => {
      editor.off('transaction', recompute)
    }
  }, [editor])

  if (!editor || !state) return null

  const commit = (): void => {
    const trimmed = draft.trim()
    if (!trimmed) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: trimmed }).run()
    }
  }

  const remove = (): void => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run()
    setState(null)
  }

  return (
    <div className="link-edit-popover" style={{ top: state.top, left: state.left }}>
      <input
        id="link-edit-url-input"
        type="text"
        value={draft}
        placeholder="https://…"
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            commit()
          } else if (e.key === 'Escape') {
            e.preventDefault()
            setDraft(state.href)
            ;(e.target as HTMLInputElement).blur()
          }
        }}
        onBlur={commit}
      />
      <button onMouseDown={(e) => e.preventDefault()} onClick={remove}>
        Remove link
      </button>
    </div>
  )
}
