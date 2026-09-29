import { ipcMain } from 'electron'
import type { SidecarCommentsFile, SidecarRevisionsFile } from '@shared/types/comments'
import { loadComments, saveComments, loadRevisions, saveRevisions } from '../lib/sidecarStore'

export function registerSidecarHandlers(): void {
  ipcMain.handle('sidecar:loadComments', async (_e, mdFilePath: string): Promise<SidecarCommentsFile> => {
    return loadComments(mdFilePath)
  })

  ipcMain.handle(
    'sidecar:saveComments',
    async (_e, mdFilePath: string, data: SidecarCommentsFile): Promise<void> => {
      await saveComments(mdFilePath, data)
    }
  )

  ipcMain.handle('sidecar:loadRevisions', async (_e, mdFilePath: string): Promise<SidecarRevisionsFile> => {
    return loadRevisions(mdFilePath)
  })

  ipcMain.handle(
    'sidecar:saveRevisions',
    async (_e, mdFilePath: string, data: SidecarRevisionsFile): Promise<void> => {
      await saveRevisions(mdFilePath, data)
    }
  )
}
