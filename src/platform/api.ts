import type { ProseCombatApi } from '@shared/types/platformContract'
import * as workspace from './workspace'
import * as credentials from './credentials'
import * as settings from './settings'
import * as llm from './llm'
import * as fullscreen from './fullscreen'

export const api: ProseCombatApi = {
  file: {
    openWorkspace: workspace.openWorkspace,
    reopenLastWorkspace: workspace.reopenLastWorkspace,
    openFile: workspace.openFile,
    createNew: workspace.createNew,
    save: workspace.save
  },
  sidecar: {
    loadComments: workspace.loadComments,
    saveComments: workspace.saveComments,
    loadRevisions: workspace.loadRevisions,
    saveRevisions: workspace.saveRevisions
  },
  credential: {
    has: async () => credentials.hasApiKey(),
    set: async (apiKey: string) => credentials.setApiKey(apiKey),
    clear: async () => credentials.clearApiKey()
  },
  settings: {
    get: async () => settings.getSettings(),
    set: async (partial) => settings.setSettings(partial)
  },
  llm: {
    critique: llm.critique,
    compare: llm.compare
  },
  window: {
    setFullScreen: fullscreen.setFullScreen,
    isFullScreen: async () => fullscreen.isFullScreen(),
    onFullScreenChange: fullscreen.onFullScreenChange
  }
}
