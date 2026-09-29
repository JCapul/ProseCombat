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
import { WorkspaceFileList } from './fileBrowser/WorkspaceFileList'
import { api } from './platform/api'
import { peekLastWorkspaceName } from './platform/workspace'

export default function App(): React.JSX.Element {
  const editorRef = useRef<Editor | null>(null)
  const [editor, setEditor] = useState<Editor | null>(null)
  const [documentKey, setDocumentKey] = useState('untitled')
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [fileListOpen, setFileListOpen] = useState(false)
  const [rememberedWorkspaceName, setRememberedWorkspaceName] = useState<string | null>(null)

  const doc = useDocumentStore((s) => s.doc)
  const workspaceDirHandle = useDocumentStore((s) => s.workspaceDirHandle)
  const workspaceFiles = useDocumentStore((s) => s.workspaceFiles)
  const originalSource = useDocumentStore((s) => s.originalSource)
  const isSaving = useDocumentStore((s) => s.isSaving)
  const lastError = useDocumentStore((s) => s.lastError)
  const setWorkspace = useDocumentStore((s) => s.setWorkspace)
  const addWorkspaceFile = useDocumentStore((s) => s.addWorkspaceFile)
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
    void peekLastWorkspaceName().then(setRememberedWorkspaceName)
  }, [])

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

  const openDocument = useCallback(
    (openedDoc: { name: string; fileHandle: FileSystemFileHandle; dirHandle: FileSystemDirectoryHandle }, content: string) => {
      setOpenedFile(openedDoc, content)
      setDocumentKey(openedDoc.name)
      setFileListOpen(false)
    },
    [setOpenedFile]
  )

  // "Open" is folder-first: the File System Access API can't get a file's parent
  // directory from a file handle alone, so the whole workspace folder is what gets
  // picked and remembered — the file list below it is just an in-app affordance.
  const handleOpen = useCallback(async () => {
    if (workspaceDirHandle) {
      setFileListOpen(true)
      return
    }
    const result = await api.file.openWorkspace()
    if (!result) return
    setWorkspace(result.dirHandle, result.files)
    setRememberedWorkspaceName(result.dirHandle.name)
    setFileListOpen(true)
  }, [workspaceDirHandle, setWorkspace])

  const handleReopenLastWorkspace = useCallback(async () => {
    const result = await api.file.reopenLastWorkspace()
    if (!result) return
    setWorkspace(result.dirHandle, result.files)
    setFileListOpen(true)
  }, [setWorkspace])

  const handleChangeWorkspace = useCallback(async () => {
    const result = await api.file.openWorkspace()
    if (!result) return
    setWorkspace(result.dirHandle, result.files)
    setRememberedWorkspaceName(result.dirHandle.name)
  }, [setWorkspace])

  const handleSelectFile = useCallback(
    async (name: string) => {
      if (!workspaceDirHandle) return
      const { doc: openedDoc, content } = await api.file.openFile(workspaceDirHandle, name)
      openDocument(openedDoc, content)
    },
    [workspaceDirHandle, openDocument]
  )

  const handleCreateNewFile = useCallback(
    async (name: string) => {
      if (!workspaceDirHandle) return
      const { doc: newDoc, content } = await api.file.createNew(workspaceDirHandle, name)
      addWorkspaceFile(name)
      openDocument(newDoc, content)
    },
    [workspaceDirHandle, addWorkspaceFile, openDocument]
  )

  const handleSave = useCallback(async () => {
    const editor = editorRef.current
    if (!editor) return
    setSaving(true)
    try {
      const freshFullMarkdown = editor.getMarkdown()
      const pluginState = blockTrackingPluginKey.getState(editor.state)
      const dirtyFlags = getDirtyFlags(pluginState)

      const contentToWrite = doc
        ? serializeWithMinimalDiff({ originalSource, freshFullMarkdown, dirtyFlags })
        : freshFullMarkdown

      if (doc) {
        await api.file.save(doc, contentToWrite)
        markSaved(doc, contentToWrite)
        return
      }

      // No document yet (the app's blank starting canvas): pick a workspace folder,
      // then a filename, then save straight into it.
      let dirHandle = workspaceDirHandle
      if (!dirHandle) {
        const result = await api.file.openWorkspace()
        if (!result) {
          setSaving(false)
          return
        }
        setWorkspace(result.dirHandle, result.files)
        setRememberedWorkspaceName(result.dirHandle.name)
        dirHandle = result.dirHandle
      }
      const name = window.prompt('Save as filename:', 'untitled.md')?.trim()
      if (!name) {
        setSaving(false)
        return
      }
      const fileName = /\.(md|markdown)$/i.test(name) ? name : `${name}.md`
      const { doc: newDoc } = await api.file.createNew(dirHandle, fileName)
      await api.file.save(newDoc, contentToWrite)
      addWorkspaceFile(fileName)
      markSaved(newDoc, contentToWrite)
      setDocumentKey(newDoc.name)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }, [doc, originalSource, workspaceDirHandle, setWorkspace, addWorkspaceFile, setSaving, markSaved, setError])

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
      const openDoc = useDocumentStore.getState().doc
      if (openDoc) {
        await useCommentsStore.getState().loadForFile(openDoc)
      } else {
        useCommentsStore.getState().resetForNewFile()
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
          <button onClick={() => void handleOpen()}>Open</button>
          {!workspaceDirHandle && rememberedWorkspaceName && (
            <button onClick={() => void handleReopenLastWorkspace()}>
              Reopen "{rememberedWorkspaceName}"
            </button>
          )}
          <button onClick={() => void handleSave()} disabled={isSaving}>
            {isSaving ? 'Saving…' : 'Save'}
          </button>
          <button onClick={() => setPaletteOpen(true)} title="Cmd/Ctrl+K">
            Critique…
          </button>
          <DetachedCommentsList />
          <span style={{ flex: 1 }} />
          {!hasApiKey && <span className="api-key-warning">No API key set</span>}
          <span style={{ color: 'var(--muted)' }}>{doc?.name ?? 'Untitled'}</span>
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
      {fileListOpen && workspaceDirHandle && (
        <WorkspaceFileList
          workspaceName={workspaceDirHandle.name}
          files={workspaceFiles}
          onOpen={(name) => void handleSelectFile(name)}
          onCreateNew={(name) => void handleCreateNewFile(name)}
          onChangeWorkspace={() => void handleChangeWorkspace()}
          onClose={() => setFileListOpen(false)}
        />
      )}
    </div>
  )
}
