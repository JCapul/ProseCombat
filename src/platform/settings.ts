import type { AppSettings } from '@shared/types/platformContract'

const STORAGE_KEY = 'prosecombat.settings'

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

function readStored(): Partial<AppSettings> {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return {}
  try {
    return JSON.parse(raw) as Partial<AppSettings>
  } catch {
    return {}
  }
}

export function getSettings(): AppSettings {
  const stored = readStored()
  return {
    provider: stored.provider ?? defaults.provider,
    model: stored.model ?? defaults.model,
    focusMode: { ...defaults.focusMode, ...stored.focusMode }
  }
}

export function setSettings(partial: Partial<AppSettings>): AppSettings {
  const current = getSettings()
  const next: AppSettings = {
    provider: partial.provider ?? current.provider,
    model: partial.model ?? current.model,
    focusMode: partial.focusMode ? { ...current.focusMode, ...partial.focusMode } : current.focusMode
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  return next
}
