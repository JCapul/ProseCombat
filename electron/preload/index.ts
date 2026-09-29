import { contextBridge, ipcRenderer } from 'electron'
import type {
  OpenFileResult,
  SaveFileArgs,
  SidecarComments,
  SidecarRevisions,
  AppSettings,
  CritiqueRequest,
  CritiqueResponse,
  CompareRequest,
  CompareResponse,
  ProseCombatApi
} from '@shared/types/ipcContract'

const api: ProseCombatApi = {
  file: {
    open: (): Promise<OpenFileResult | null> => ipcRenderer.invoke('file:open'),
    openPath: (path: string): Promise<OpenFileResult> => ipcRenderer.invoke('file:openPath', path),
    save: (args: SaveFileArgs): Promise<{ path: string }> => ipcRenderer.invoke('file:save', args),
    saveAs: (args: SaveFileArgs): Promise<{ path: string } | null> =>
      ipcRenderer.invoke('file:saveAs', args),
    new: (): Promise<OpenFileResult> => ipcRenderer.invoke('file:new')
  },
  sidecar: {
    loadComments: (mdFilePath: string): Promise<SidecarComments> =>
      ipcRenderer.invoke('sidecar:loadComments', mdFilePath),
    saveComments: (mdFilePath: string, data: SidecarComments): Promise<void> =>
      ipcRenderer.invoke('sidecar:saveComments', mdFilePath, data),
    loadRevisions: (mdFilePath: string): Promise<SidecarRevisions> =>
      ipcRenderer.invoke('sidecar:loadRevisions', mdFilePath),
    saveRevisions: (mdFilePath: string, data: SidecarRevisions): Promise<void> =>
      ipcRenderer.invoke('sidecar:saveRevisions', mdFilePath, data)
  },
  credential: {
    has: (): Promise<boolean> => ipcRenderer.invoke('credential:has'),
    set: (apiKey: string): Promise<void> => ipcRenderer.invoke('credential:set', apiKey),
    clear: (): Promise<void> => ipcRenderer.invoke('credential:clear')
  },
  settings: {
    get: (): Promise<AppSettings> => ipcRenderer.invoke('settings:get'),
    set: (settings: Partial<AppSettings>): Promise<AppSettings> =>
      ipcRenderer.invoke('settings:set', settings)
  },
  llm: {
    critique: (input: CritiqueRequest): Promise<CritiqueResponse> =>
      ipcRenderer.invoke('llm:critique', input),
    compare: (input: CompareRequest): Promise<CompareResponse> =>
      ipcRenderer.invoke('llm:compare', input)
  },
  window: {
    setFullScreen: (fullscreen: boolean): Promise<void> => ipcRenderer.invoke('window:setFullScreen', fullscreen),
    isFullScreen: (): Promise<boolean> => ipcRenderer.invoke('window:isFullScreen'),
    onFullScreenChange: (callback: (fullscreen: boolean) => void): (() => void) => {
      const listener = (_event: Electron.IpcRendererEvent, fullscreen: boolean): void => callback(fullscreen)
      ipcRenderer.on('window:fullscreen-changed', listener)
      return () => ipcRenderer.removeListener('window:fullscreen-changed', listener)
    }
  }
}

contextBridge.exposeInMainWorld('api', api)
