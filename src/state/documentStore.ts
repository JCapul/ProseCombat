import { create } from 'zustand'

interface DocumentState {
  filePath: string | null
  originalSource: string
  isNewUnsavedFile: boolean
  isSaving: boolean
  lastError: string | null
  setOpenedFile: (path: string, content: string) => void
  markSaved: (path: string, savedSource: string) => void
  setSaving: (saving: boolean) => void
  setError: (message: string | null) => void
}

export const useDocumentStore = create<DocumentState>((set) => ({
  filePath: null,
  originalSource: '',
  isNewUnsavedFile: true,
  isSaving: false,
  lastError: null,
  setOpenedFile: (path, content) =>
    set({ filePath: path, originalSource: content, isNewUnsavedFile: false, lastError: null }),
  markSaved: (path, savedSource) =>
    set({ filePath: path, originalSource: savedSource, isNewUnsavedFile: false, isSaving: false }),
  setSaving: (saving) => set({ isSaving: saving }),
  setError: (message) => set({ lastError: message, isSaving: false })
}))
