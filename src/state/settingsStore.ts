import { create } from 'zustand'
import type { AppSettings } from '@shared/types/platformContract'
import { api } from '../platform/api'

interface SettingsState {
  settings: AppSettings | null
  hasApiKey: boolean
  loaded: boolean
  load: () => Promise<void>
  update: (partial: Partial<AppSettings>) => Promise<void>
  refreshHasApiKey: () => Promise<void>
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: null,
  hasApiKey: false,
  loaded: false,
  load: async () => {
    const [settings, hasApiKey] = await Promise.all([api.settings.get(), api.credential.has()])
    set({ settings, hasApiKey, loaded: true })
  },
  update: async (partial) => {
    const settings = await api.settings.set(partial)
    set({ settings })
  },
  refreshHasApiKey: async () => {
    const hasApiKey = await api.credential.has()
    set({ hasApiKey })
  }
}))
