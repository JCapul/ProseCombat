import { useState } from 'react'
import { ANTHROPIC_MODELS, AVAILABLE_PROVIDERS } from '@shared/types/llmProvider'
import { useSettingsStore } from '../state/settingsStore'
import { api } from '../ipcClient/api'
import { FONT_CHOICES } from './fontChoices'

export function SettingsPanel({ onClose }: { onClose: () => void }): React.JSX.Element {
  const settings = useSettingsStore((s) => s.settings)
  const hasApiKey = useSettingsStore((s) => s.hasApiKey)
  const update = useSettingsStore((s) => s.update)
  const refreshHasApiKey = useSettingsStore((s) => s.refreshHasApiKey)

  const [apiKeyInput, setApiKeyInput] = useState('')
  const [keyStatus, setKeyStatus] = useState<string | null>(null)

  if (!settings) return <></>

  const handleSaveKey = async (): Promise<void> => {
    if (!apiKeyInput.trim()) return
    await api.credential.set(apiKeyInput.trim())
    setApiKeyInput('')
    setKeyStatus('Key saved.')
    await refreshHasApiKey()
  }

  const handleClearKey = async (): Promise<void> => {
    await api.credential.clear()
    setKeyStatus('Key cleared.')
    await refreshHasApiKey()
  }

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        <h2>Settings</h2>

        <label>
          Provider
          <select
            value={settings.provider}
            onChange={(e) => void update({ provider: e.target.value as typeof settings.provider })}
          >
            {AVAILABLE_PROVIDERS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Model
          <select value={settings.model} onChange={(e) => void update({ model: e.target.value })}>
            {ANTHROPIC_MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </label>

        <div className="api-key-field">
          <label>API key</label>
          <div className="api-key-status">{hasApiKey ? 'Key configured' : 'No key set'}</div>
          <div className="api-key-row">
            <input
              type="password"
              placeholder="sk-ant-…"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
            />
            <button onClick={() => void handleSaveKey()}>Save</button>
            <button onClick={() => void handleClearKey()}>Clear</button>
          </div>
          {keyStatus && <div className="api-key-status">{keyStatus}</div>}
        </div>

        <h3>Appearance</h3>
        <label>
          Typeface
          <select
            value={settings.focusMode.fontFamily}
            onChange={(e) => void update({ focusMode: { ...settings.focusMode, fontFamily: e.target.value } })}
          >
            {FONT_CHOICES.map((f) => (
              <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Background color
          <div className="color-row">
            <input
              type="color"
              value={settings.focusMode.backgroundColor ?? '#ffffff'}
              onChange={(e) =>
                void update({ focusMode: { ...settings.focusMode, backgroundColor: e.target.value } })
              }
            />
            <button
              onClick={() => void update({ focusMode: { ...settings.focusMode, backgroundColor: null } })}
              disabled={!settings.focusMode.backgroundColor}
            >
              Use theme default
            </button>
          </div>
        </label>
        <label>
          Text color
          <div className="color-row">
            <input
              type="color"
              value={settings.focusMode.textColor ?? '#1a1a1a'}
              onChange={(e) => void update({ focusMode: { ...settings.focusMode, textColor: e.target.value } })}
            />
            <button
              onClick={() => void update({ focusMode: { ...settings.focusMode, textColor: null } })}
              disabled={!settings.focusMode.textColor}
            >
              Use theme default
            </button>
          </div>
        </label>

        <h3>Focus mode typography</h3>
        <label>
          Font size (px)
          <input
            type="number"
            value={settings.focusMode.fontSizePx}
            onChange={(e) =>
              void update({ focusMode: { ...settings.focusMode, fontSizePx: Number(e.target.value) } })
            }
          />
        </label>
        <label>
          Line height
          <input
            type="number"
            step="0.1"
            value={settings.focusMode.lineHeight}
            onChange={(e) =>
              void update({ focusMode: { ...settings.focusMode, lineHeight: Number(e.target.value) } })
            }
          />
        </label>
        <label>
          Text width (ch)
          <input
            type="number"
            value={settings.focusMode.textWidthCh}
            onChange={(e) =>
              void update({ focusMode: { ...settings.focusMode, textWidthCh: Number(e.target.value) } })
            }
          />
        </label>
        <label>
          Theme
          <select
            value={settings.focusMode.theme}
            onChange={(e) =>
              void update({
                focusMode: { ...settings.focusMode, theme: e.target.value as 'light' | 'dark' | 'system' }
              })
            }
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>

        <div className="settings-actions">
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
