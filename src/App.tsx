import { useCallback, useEffect, useRef, useState } from 'react'
import type { Editor } from '@tiptap/react'
import { TipTapEditor } from './editor/TipTapEditor'
import { FocusModeOverlay } from './editor/focusMode/FocusModeOverlay'
import { useFocusModeActive } from './editor/focusMode/useFocusModeActive'
import { blockTrackingPluginKey, getDirtyFlags } from './editor/blockTracking/blockTrackingPlugin'
import { serializeWithMinimalDiff } from './editor/blockTracking/serializeWithMinimalDiff'
import { useDocumentStore } from './state/documentStore'
import { useSettingsStore } from './state/settingsStore'
import { useCommentsStore } from './comments/commentsStore'
import { applyReanchoring } from './comments/anchoring/applyReanchoring'
import { CommentsMarginPanel } from './comments/CommentsMarginPanel'
import { DetachedCommentsList } from './comments/DetachedCommentsList'
import { LinkEditPopover } from './editor/links/LinkEditPopover'
import { CommandPalette } from './ai/commandPalette/CommandPalette'
import { SettingsPanel } from './settings/SettingsPanel'
import { api } from './ipcClient/api'

const UNTITLED_DEFAULT_PATH = 'untitled.md'

export default function App(): React.JSX.Element {
  const editorRef = useRef<Editor | null>(null)
  const [editor, setEditor] = useState<Editor | null>(null)
  const [documentKey, setDocumentKey] = useState('untitled')
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const filePath = useDocumentStore((s) => s.filePath)
  const originalSource = useDocumentStore((s) => s.originalSource)
  const isSaving = useDocumentStore((s) => s.isSaving)
  const lastError = useDocumentStore((s) => s.lastError)
  const setOpenedFile = useDocumentStore((s) => s.setOpenedFile)
  const markSaved = useDocumentStore((s) => s.markSaved)
  const setSaving = useDocumentStore((s) => s.setSaving)
  const setError = useDocumentStore((s) => s.setError)

  const focusModeActive = useFocusModeActive((s) => s.active)
  const toggleFocusMode = useFocusModeActive((s) => s.toggle)

  const loadSettings = useSettingsStore((s) => s.load)
  const settingsLoaded = useSettingsStore((s) => s.loaded)
  const hasApiKey = useSettingsStore((s) => s.hasApiKey)
  const settings = useSettingsStore((s) => s.settings)

  useEffect(() => {
    void loadSettings()
  }, [loadSettings])

  useEffect(() => {
    const theme = settings?.focusMode.theme
    if (!theme || theme === 'system') {
      delete document.documentElement.dataset.theme
    } else {
      document.documentElement.dataset.theme = theme
    }
  }, [settings?.focusMode.theme])

  // Focus mode = fullscreen, in both directions: toggling focus mode drives the
  // OS-level fullscreen state, and exiting fullscreen by any other means (Escape,
  // a native title-bar control) drops focus mode too, so the two never drift out
  // of sync with each other.
  useEffect(() => {
    void api.window.setFullScreen(focusModeActive)
  }, [focusModeActive])

  useEffect(() => {
    return api.window.onFullScreenChange((fullscreen) => {
      useFocusModeActive.getState().setActive(fullscreen)
    })
  }, [])

  const handleOpen = useCallback(async () => {
    const result = await api.file.open()
    if (!result) return
    setOpenedFile(result.path, result.content)
    setDocumentKey(result.path)
  }, [setOpenedFile])

  const handleNew = useCallback(async () => {
    try {
      const result = await api.file.new()
      setOpenedFile(result.path, result.content)
      setDocumentKey(result.path)
    } catch {
      // user canceled the save dialog — nothing to do
    }
  }, [setOpenedFile])

  const handleSave = useCallback(async () => {
    const editor = editorRef.current
    if (!editor) return
    setSaving(true)
    try {
      const freshFullMarkdown = editor.getMarkdown()
      const pluginState = blockTrackingPluginKey.getState(editor.state)
      const dirtyFlags = getDirtyFlags(pluginState)

      const contentToWrite = filePath
        ? serializeWithMinimalDiff({ originalSource, freshFullMarkdown, dirtyFlags })
        : freshFullMarkdown

      if (filePath) {
        await api.file.save({ path: filePath, content: contentToWrite })
        markSaved(filePath, contentToWrite)
      } else {
        const result = await api.file.saveAs({ path: UNTITLED_DEFAULT_PATH, content: contentToWrite })
        if (result) {
          markSaved(result.path, contentToWrite)
          setDocumentKey(result.path)
        } else {
          setSaving(false)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }, [filePath, originalSource, setSaving, markSaved, setError])

  useEffect(() => {
    function handleKeydown(e: KeyboardEvent): void {
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault()
        toggleFocusMode()
      } else if (mod && e.key.toLowerCase() === 's') {
        e.preventDefault()
        void handleSave()
      } else if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  }, [toggleFocusMode, handleSave])

  const handleEditorReady = useCallback((readyEditor: Editor) => {
    editorRef.current = readyEditor
    setEditor(readyEditor)
    void (async () => {
      const path = useDocumentStore.getState().filePath
      if (path) {
        await useCommentsStore.getState().loadForFile(path)
      } else {
        useCommentsStore.getState().resetForNewFile('untitled')
      }
      applyReanchoring(readyEditor, useCommentsStore.getState().comments)
    })()
  }, [])

  const handleEditorDestroy = useCallback(() => {
    editorRef.current = null
    setEditor(null)
  }, [])

  if (!settingsLoaded) {
    return <div className="app-shell" />
  }

  const colorOverrides: Record<string, string> = {}
  if (settings?.focusMode.backgroundColor) colorOverrides['--bg'] = settings.focusMode.backgroundColor
  if (settings?.focusMode.textColor) colorOverrides['--fg'] = settings.focusMode.textColor

  return (
    <div className="app-shell" style={colorOverrides as React.CSSProperties}>
      {!focusModeActive && (
        <div className="app-toolbar">
          <button onClick={() => void handleNew()}>New</button>
          <button onClick={() => void handleOpen()}>Open</button>
          <button onClick={() => void handleSave()} disabled={isSaving}>
            {isSaving ? 'Saving…' : 'Save'}
          </button>
          <button onClick={() => setPaletteOpen(true)} title="Cmd/Ctrl+K">
            Critique…
          </button>
          <DetachedCommentsList />
          <span style={{ flex: 1 }} />
          {!hasApiKey && <span className="api-key-warning">No API key set</span>}
          <span style={{ color: 'var(--muted)' }}>{filePath ?? 'Untitled'}</span>
          <button onClick={() => toggleFocusMode()} title="Cmd/Ctrl+Shift+F">
            Focus mode
          </button>
          <button onClick={() => setSettingsOpen(true)}>Settings</button>
          {lastError && <span style={{ color: '#c0392b' }}>{lastError}</span>}
        </div>
      )}
      <div className="app-body">
        <FocusModeOverlay>
          <TipTapEditor
            key={documentKey}
            documentKey={documentKey}
            initialMarkdown={originalSource}
            onReady={handleEditorReady}
            onDestroy={handleEditorDestroy}
          />
        </FocusModeOverlay>
        <CommentsMarginPanel editor={editor} />
        {!focusModeActive && <LinkEditPopover editor={editor} />}
      </div>
      <CommandPalette
        editor={editor}
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        onOpenSettings={() => setSettingsOpen(true)}
      />
      {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
    </div>
  )
}
