import { useEffect } from 'react'
import { EditorContent, useEditor, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import BoldExtension from '@tiptap/extension-bold'
import ItalicExtension from '@tiptap/extension-italic'
import CodeExtension from '@tiptap/extension-code'
import LinkExtension from '@tiptap/extension-link'
import { Markdown } from '@tiptap/markdown'
import { Extension } from '@tiptap/core'
import { createBlockTrackingPlugin } from './blockTracking/blockTrackingPlugin'
import { createCommentDecorationPlugin } from '../comments/anchoring/decorationPlugin'
import { createLivePreviewPlugin } from './livePreview/livePreviewPlugin'

// Re-added with inclusive: false (StarterKit's bundled versions don't expose this):
// with the default inclusive: true, a cursor sitting at the very end of a bold/
// italic/code run — with nothing after it in the block — keeps applying the mark
// to newly typed text, which is exactly what makes it impossible to "escape" a
// mark at the end of a line and continue writing plain text.
const Bold = BoldExtension.extend({ inclusive: false })
const Italic = ItalicExtension.extend({ inclusive: false })
const Code = CodeExtension.extend({ inclusive: false })

// markdownLinks: typing/pasting [text](url) converts it into a real link, same
// as **bold**/*italic* already auto-convert — off by default in the extension.
// inclusive: false for the same reason as the marks above (Link's own default
// ties inclusive to `autolink`, which is true by default).
const Link = LinkExtension.extend({ inclusive: false }).configure({ markdownLinks: true })

const BlockTracking = Extension.create({
  name: 'blockTracking',
  addProseMirrorPlugins() {
    return [createBlockTrackingPlugin()]
  }
})

const CommentDecorations = Extension.create({
  name: 'commentDecorations',
  addProseMirrorPlugins() {
    return [createCommentDecorationPlugin()]
  }
})

const LivePreview = Extension.create({
  name: 'livePreview',
  addProseMirrorPlugins() {
    return [createLivePreviewPlugin()]
  }
})

interface TipTapEditorProps {
  initialMarkdown: string
  /** Change this (e.g. the file path) to force the editor to fully reinitialize —
   *  including the block-tracking plugin's baseline — when a different file is opened. */
  documentKey: string
  onReady: (editor: Editor) => void
  onDestroy: () => void
}

export function TipTapEditor({
  initialMarkdown,
  documentKey,
  onReady,
  onDestroy
}: TipTapEditorProps): React.JSX.Element {
  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({ bold: false, italic: false, code: false, link: false }),
        Bold,
        Italic,
        Code,
        Link,
        Markdown,
        BlockTracking,
        CommentDecorations,
        LivePreview
      ],
      content: initialMarkdown,
      contentType: 'markdown',
      autofocus: 'end',
      editorProps: {
        attributes: {
          class: 'prose-editor',
          // The red squiggly underline comes from Chromium's native spellchecker
          // reacting to this attribute — there's no UI wired up to act on it (no
          // right-click "did you mean" menu), so it's just noise. Off entirely
          // rather than leaving an inert distraction in a writing app.
          spellcheck: 'false'
        }
      }
    },
    [documentKey]
  )

  useEffect(() => {
    if (!editor) return
    onReady(editor)
    return () => onDestroy()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor])

  return <EditorContent editor={editor} />
}
