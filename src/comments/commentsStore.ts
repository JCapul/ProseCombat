import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type { Comment, RevisionEvaluation, CritiqueCategory, CritiqueSeverity } from '@shared/types/comments'
import { emptyCommentsFile, emptyRevisionsFile } from '@shared/types/comments'
import { api } from '../ipcClient/api'

interface CommentsState {
  comments: Comment[]
  revisions: RevisionEvaluation[]
  filePath: string | null
  loadForFile: (path: string) => Promise<void>
  resetForNewFile: (path: string) => void
  addComments: (
    input: { start: number; end: number; category: CritiqueCategory; severity: CritiqueSeverity; comment: string }[],
    docText: string,
    contextChars?: number
  ) => Promise<Comment[]>
  updateCommentStatus: (id: string, status: Comment['status']) => Promise<void>
  addRevisionEvaluation: (evaluation: Omit<RevisionEvaluation, 'id'>) => Promise<void>
  persist: () => Promise<void>
}

function deriveAnchor(
  start: number,
  end: number,
  docText: string,
  contextChars: number
): { selectedText: string; prefix: string; suffix: string; start: number; end: number } {
  return {
    selectedText: docText.slice(start, end),
    prefix: docText.slice(Math.max(0, start - contextChars), start),
    suffix: docText.slice(end, end + contextChars),
    start,
    end
  }
}

export const useCommentsStore = create<CommentsState>((set, get) => ({
  comments: [],
  revisions: [],
  filePath: null,

  loadForFile: async (path: string) => {
    const [commentsFile, revisionsFile] = await Promise.all([
      api.sidecar.loadComments(path),
      api.sidecar.loadRevisions(path)
    ])
    set({ filePath: path, comments: commentsFile.comments, revisions: revisionsFile.revisions })
  },

  resetForNewFile: (path: string) => {
    set({ filePath: path, comments: [], revisions: [] })
  },

  addComments: async (input, docText, contextChars = 80) => {
    const newComments: Comment[] = input.map((c) => ({
      id: uuidv4(),
      anchor: deriveAnchor(c.start, c.end, docText, contextChars),
      category: c.category,
      severity: c.severity,
      comment: c.comment,
      createdAt: new Date().toISOString(),
      status: 'active'
    }))
    set((s) => ({ comments: [...s.comments, ...newComments] }))
    await get().persist()
    return newComments
  },

  updateCommentStatus: async (id, status) => {
    set((s) => ({ comments: s.comments.map((c) => (c.id === id ? { ...c, status } : c)) }))
    await get().persist()
  },

  addRevisionEvaluation: async (evaluation) => {
    const withId: RevisionEvaluation = { ...evaluation, id: uuidv4() }
    set((s) => ({ revisions: [...s.revisions, withId] }))
    const { filePath, revisions } = get()
    if (filePath) {
      await api.sidecar.saveRevisions(filePath, { ...emptyRevisionsFile(), revisions })
    }
  },

  persist: async () => {
    const { filePath, comments } = get()
    if (!filePath) return
    await api.sidecar.saveComments(filePath, { ...emptyCommentsFile(), comments })
  }
}))
