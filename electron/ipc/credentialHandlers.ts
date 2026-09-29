import { ipcMain } from 'electron'
import { hasApiKey, setApiKey, clearApiKey } from '../lib/credentialStore'

// Deliberately no "credential:get" channel: the renderer only ever needs to know whether
// a key is configured, never the key's value. All LLM calls happen in the main process
// (see llmHandlers.ts), so the plaintext key never needs to cross into renderer JS.
export function registerCredentialHandlers(): void {
  ipcMain.handle('credential:has', async (): Promise<boolean> => hasApiKey())

  ipcMain.handle('credential:set', async (_e, apiKey: string): Promise<void> => {
    await setApiKey(apiKey)
  })

  ipcMain.handle('credential:clear', async (): Promise<void> => {
    await clearApiKey()
  })
}
