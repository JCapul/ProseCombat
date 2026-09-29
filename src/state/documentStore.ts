import { create } from 'zustand'
import type { OpenDocumentRef } from '@shared/types/platformContract'

interface DocumentState {
  /** Bumped on every setWorkspace call — combined with a doc's name to form a React key
   *  that's unique across workspaces, since two different folders can both contain a
   *  same-named file (e.g. "untitled.md"). See documentKey in App.tsx. */
  workspaceId: number
  workspaceDirHandle: FileSystemDirectoryHandle | null
  workspaceFiles: string[]
  doc: OpenDocumentRef | null
  originalSource: string
  isSaving: boolean
  lastError: string | null
  setWorkspace: (dirHandle: FileSystemDirectoryHandle, files: string[]) => void
  addWorkspaceFile: (name: string) => void
  setOpenedFile: (doc: OpenDocumentRef, content: string) => void
  markSaved: (doc: OpenDocumentRef, savedSource: string) => void
  setSaving: (saving: boolean) => void
  setError: (message: string | null) => void
}

export const useDocumentStore = create<DocumentState>((set) => ({
  workspaceId: 0,
  workspaceDirHandle: null,
  workspaceFiles: [],
  doc: null,
  originalSource: '',
  isSaving: false,
  lastError: null,
  setWorkspace: (dirHandle, files) =>
    set((s) => ({ workspaceId: s.workspaceId + 1, workspaceDirHandle: dirHandle, workspaceFiles: files })),
  addWorkspaceFile: (name) =>
    set((s) => ({
      workspaceFiles: s.workspaceFiles.includes(name)
        ? s.workspaceFiles
        : [...s.workspaceFiles, name].sort((a, b) => a.localeCompare(b))
    })),
  setOpenedFile: (doc, content) =>
    set({ doc, originalSource: content, lastError: null }),
  markSaved: (doc, savedSource) => set({ doc, originalSource: savedSource, isSaving: false }),
  setSaving: (saving) => set({ isSaving: saving }),
  setError: (message) => set({ lastError: message, isSaving: false })
}))
