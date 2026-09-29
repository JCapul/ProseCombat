import { ipcMain } from 'electron'
import type { AppSettings } from '@shared/types/ipcContract'
import { getSettings, setSettings } from '../lib/settingsStore'

export function registerSettingsHandlers(): void {
  ipcMain.handle('settings:get', async (): Promise<AppSettings> => getSettings())

  ipcMain.handle('settings:set', async (_e, partial: Partial<AppSettings>): Promise<AppSettings> => {
    return setSettings(partial)
  })
}
