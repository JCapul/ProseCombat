import { useState } from 'react'
import { Command } from 'cmdk'
import type { Editor } from '@tiptap/react'
import type { CritiqueCategory } from '@shared/types/comments'
import { runCritique } from '../critique/critiqueRequest'
import { useFocusModeActive } from '../../editor/focusMode/useFocusModeActive'

interface CommandPaletteProps {
  editor: Editor | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onOpenSettings: () => void
}

const CRITIQUE_MODES: { mode: CritiqueCategory; label: string }[] = [
  { mode: 'general', label: 'Critique document' },
  { mode: 'argument', label: 'Critique argument' },
  { mode: 'structure', label: 'Critique structure' },
  { mode: 'prose', label: 'Critique prose' }
]

export function CommandPalette({ editor, open, onOpenChange, onOpenSettings }: CommandPaletteProps): React.JSX.Element {
  const toggleFocusMode = useFocusModeActive((s) => s.toggle)
  const [running, setRunning] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  const handleOpenChange = (nextOpen: boolean): void => {
    if (nextOpen) setStatus(null)
    onOpenChange(nextOpen)
  }

  const run = async (mode: CritiqueCategory): Promise<void> => {
    if (!editor || running) return
    setRunning(true)
    setStatus('Critiquing…')
    try {
      const result = await runCritique(editor, mode)
      setStatus(
        result.withheldCount > 0
          ? `Added ${result.addedCount} comment(s); withheld ${result.withheldCount} that looked like rewrites.`
          : `Added ${result.addedCount} comment(s).`
      )
    } catch (err) {
      setStatus(err instanceof Error ? err.message : String(err))
    } finally {
      setRunning(false)
    }
  }

  return (
    <Command.Dialog open={open} onOpenChange={handleOpenChange} label="Command palette">
      <Command.Input placeholder="Type a command…" />
      <Command.List>
        <Command.Empty>No matching command.</Command.Empty>
        <Command.Group heading="Critique">
          {CRITIQUE_MODES.map(({ mode, label }) => (
            <Command.Item key={mode} onSelect={() => void run(mode)} disabled={!editor || running}>
              {label}
            </Command.Item>
          ))}
        </Command.Group>
        <Command.Group heading="View">
          <Command.Item
            onSelect={() => {
              toggleFocusMode()
              onOpenChange(false)
            }}
          >
            Toggle focus mode
          </Command.Item>
          <Command.Item
            onSelect={() => {
              onOpenSettings()
              onOpenChange(false)
            }}
          >
            Settings…
          </Command.Item>
        </Command.Group>
      </Command.List>
      {status && <div className="command-palette-status">{status}</div>}
    </Command.Dialog>
  )
}
