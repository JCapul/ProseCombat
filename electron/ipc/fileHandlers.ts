import { ipcMain, dialog, BrowserWindow } from 'electron'
import type { OpenFileResult, SaveFileArgs } from '@shared/types/ipcContract'
import { readMarkdownFile, writeMarkdownFile, fileExists } from '../lib/markdownFile'

const MARKDOWN_FILTERS = [{ name: 'Markdown', extensions: ['md', 'markdown'] }]

export function registerFileHandlers(): void {
  ipcMain.handle('file:open', async (event): Promise<OpenFileResult | null> => {
    const win = BrowserWindow.fromWebContents(event.sender) ?? undefined
    const result = await dialog.showOpenDialog(win as BrowserWindow, {
      properties: ['openFile'],
      filters: MARKDOWN_FILTERS
    })
    if (result.canceled || result.filePaths.length === 0) return null
    const path = result.filePaths[0]
    const content = await readMarkdownFile(path)
    return { path, content }
  })

  ipcMain.handle('file:openPath', async (_event, path: string): Promise<OpenFileResult> => {
    const content = await readMarkdownFile(path)
    return { path, content }
  })

  ipcMain.handle('file:save', async (_event, args: SaveFileArgs): Promise<{ path: string }> => {
    await writeMarkdownFile(args.path, args.content)
    return { path: args.path }
  })

  ipcMain.handle(
    'file:saveAs',
    async (event, args: SaveFileArgs): Promise<{ path: string } | null> => {
      const win = BrowserWindow.fromWebContents(event.sender) ?? undefined
      const result = await dialog.showSaveDialog(win as BrowserWindow, {
        defaultPath: args.path,
        filters: MARKDOWN_FILTERS
      })
      if (result.canceled || !result.filePath) return null
      await writeMarkdownFile(result.filePath, args.content)
      return { path: result.filePath }
    }
  )

  ipcMain.handle('file:new', async (event): Promise<OpenFileResult> => {
    const win = BrowserWindow.fromWebContents(event.sender) ?? undefined
    const result = await dialog.showSaveDialog(win as BrowserWindow, {
      defaultPath: 'untitled.md',
      filters: MARKDOWN_FILTERS
    })
    if (result.canceled || !result.filePath) {
      throw new Error('New file creation was canceled')
    }
    const path = result.filePath
    if (!(await fileExists(path))) {
      await writeMarkdownFile(path, '')
    }
    const content = await readMarkdownFile(path)
    return { path, content }
  })
}
