import { ipcMain, BrowserWindow } from 'electron'

export function registerWindowHandlers(): void {
  ipcMain.handle('window:setFullScreen', (event, fullscreen: boolean): void => {
    BrowserWindow.fromWebContents(event.sender)?.setFullScreen(fullscreen)
  })

  ipcMain.handle('window:isFullScreen', (event): boolean => {
    return BrowserWindow.fromWebContents(event.sender)?.isFullScreen() ?? false
  })
}
