import type { CSSProperties, PropsWithChildren } from 'react'
import { useSettingsStore } from '../../state/settingsStore'

/**
 * Applies the writer's typography preferences and centers the text column. Always
 * active (not just in focus mode) — idea.md §15 treats typography as a standing
 * preference, and focus mode on top of it just hides the surrounding chrome (toolbar,
 * comments, file browser), handled by the caller rather than this component.
 */
export function FocusModeOverlay({ children }: PropsWithChildren): React.JSX.Element {
  const settings = useSettingsStore((s) => s.settings)
  const focusMode = settings?.focusMode

  const style: CSSProperties = focusMode
    ? {
        fontFamily: focusMode.fontFamily,
        fontSize: `${focusMode.fontSizePx}px`,
        lineHeight: focusMode.lineHeight,
        maxWidth: `${focusMode.textWidthCh}ch`
      }
    : {}

  return (
    <div className="writing-column" style={style}>
      {children}
    </div>
  )
}
