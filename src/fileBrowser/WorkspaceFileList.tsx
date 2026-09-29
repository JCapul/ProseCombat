import { useState } from 'react'

interface WorkspaceFileListProps {
  workspaceName: string
  files: string[]
  onOpen: (name: string) => void
  onCreateNew: (name: string) => void
  onChangeWorkspace: () => void
  onClose: () => void
}

const DEFAULT_NEW_NAME = 'untitled.md'

export function WorkspaceFileList({
  workspaceName,
  files,
  onOpen,
  onCreateNew,
  onChangeWorkspace,
  onClose
}: WorkspaceFileListProps): React.JSX.Element {
  const [newName, setNewName] = useState(DEFAULT_NEW_NAME)

  const handleCreate = (): void => {
    const trimmed = newName.trim()
    if (!trimmed) return
    onCreateNew(/\.(md|markdown)$/i.test(trimmed) ? trimmed : `${trimmed}.md`)
  }

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        <h2>{workspaceName}</h2>

        {files.length === 0 ? (
          <p className="workspace-empty">No Markdown files in this folder yet.</p>
        ) : (
          <ul className="workspace-file-list">
            {files.map((name) => (
              <li key={name}>
                <button onClick={() => onOpen(name)}>{name}</button>
              </li>
            ))}
          </ul>
        )}

        <div className="api-key-row">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder={DEFAULT_NEW_NAME}
          />
          <button onClick={handleCreate}>New file</button>
        </div>

        <div className="settings-actions">
          <button onClick={onChangeWorkspace}>Choose a different folder…</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  )
}
