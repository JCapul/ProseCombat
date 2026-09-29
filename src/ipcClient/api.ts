import type { ProseCombatApi } from '@shared/types/ipcContract'

declare global {
  interface Window {
    api: ProseCombatApi
  }
}

export const api = window.api
