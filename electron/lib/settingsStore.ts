import Store from 'electron-store'
import type { AppSettings } from '@shared/types/ipcContract'

const defaults: AppSettings = {
  provider: 'anthropic',
  model: 'claude-sonnet-5',
  focusMode: {
    // Keep in sync with src/settings/fontChoices.ts's "Lora (serif)" entry.
    fontFamily: '"Lora", Georgia, serif',
    fontSizePx: 19,
    lineHeight: 1.6,
    textWidthCh: 68,
    theme: 'system',
    // Warm ivory + warm near-black, easier on the eyes than pure white/black
    // for long writing sessions without reading as a "sepia reading mode".
    backgroundColor: '#FAF6EE',
    textColor: '#332B22'
  }
}

const store = new Store<AppSettings>({
  name: 'settings',
  defaults
})

export function getSettings(): AppSettings {
  return {
    provider: store.get('provider'),
    model: store.get('model'),
    focusMode: store.get('focusMode')
  }
}

export function setSettings(partial: Partial<AppSettings>): AppSettings {
  if (partial.provider !== undefined) store.set('provider', partial.provider)
  if (partial.model !== undefined) store.set('model', partial.model)
  if (partial.focusMode !== undefined) {
    store.set('focusMode', { ...store.get('focusMode'), ...partial.focusMode })
  }
  return getSettings()
}
