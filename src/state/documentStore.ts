import { create } from 'zustand'
import type { OpenDocumentRef } from '@shared/types/platformContract'

interface DocumentState {
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
  workspaceDirHandle: null,
  workspaceFiles: [],
  doc: null,
  originalSource: '',
  isSaving: false,
  lastError: null,
  setWorkspace: (dirHandle, files) => set({ workspaceDirHandle: dirHandle, workspaceFiles: files }),
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
