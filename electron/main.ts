import { app, shell, BrowserWindow } from 'electron'
import { join } from 'node:path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { registerFileHandlers } from './ipc/fileHandlers'
import { registerSidecarHandlers } from './ipc/sidecarHandlers'
import { registerCredentialHandlers } from './ipc/credentialHandlers'
import { registerLlmHandlers } from './ipc/llmHandlers'
import { registerSettingsHandlers } from './ipc/settingsHandlers'
import { registerWindowHandlers } from './ipc/windowHandlers'

// Packaged builds get their icon from electron-builder's embedded resource
// (build/icon.ico / .icns) — this is for the window/taskbar icon in dev and
// unpacked-preview runs, where Electron otherwise falls back to its own logo.
const appIconPath = join(__dirname, '../../build/icon.png')

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1100,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    icon: appIconPath,
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  // Forwarded so the renderer can keep focus mode in sync when fullscreen is
  // entered/exited by means other than our own toggle — the OS-native Escape
  // key, a title-bar fullscreen button, etc.
  mainWindow.on('enter-full-screen', () => {
    mainWindow.webContents.send('window:fullscreen-changed', true)
  })
  mainWindow.on('leave-full-screen', () => {
    mainWindow.webContents.send('window:fullscreen-changed', false)
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.prosecombat.app')
  if (process.platform === 'darwin') {
    app.dock?.setIcon(appIconPath)
  }

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  registerFileHandlers()
  registerSidecarHandlers()
  registerCredentialHandlers()
  registerSettingsHandlers()
  registerLlmHandlers()
  registerWindowHandlers()

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
