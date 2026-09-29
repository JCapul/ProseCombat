import type { SidecarCommentsFile, SidecarRevisionsFile } from './comments'
import type {
  CritiqueInput,
  CritiqueComment,
  ComparisonInput,
  ComparisonResult,
  ProviderId
} from './llmProvider'

/**
 * A document opened from a workspace folder. The File System Access API has no way to
 * get a file's parent directory from a file handle alone, so `dirHandle` (granted via
 * showDirectoryPicker) is carried alongside the file handle everywhere — it's what makes
 * `.ai-editor/` sidecar access possible.
 */
export interface OpenDocumentRef {
  name: string
  fileHandle: FileSystemFileHandle
  dirHandle: FileSystemDirectoryHandle
}

export interface OpenWorkspaceResult {
  dirHandle: FileSystemDirectoryHandle
  files: string[]
}

export type SidecarComments = SidecarCommentsFile
export type SidecarRevisions = SidecarRevisionsFile

export interface AppSettings {
  provider: ProviderId
  model: string
  focusMode: {
    fontFamily: string
    fontSizePx: number
    lineHeight: number
    textWidthCh: number
    theme: 'light' | 'dark' | 'system'
    /** Overrides the theme's default page background/text color when set; null follows the theme. */
    backgroundColor: string | null
    textColor: string | null
  }
}

export type CritiqueRequest = CritiqueInput
export interface CritiqueResponse {
  comments: CritiqueComment[]
  withheldCount: number
}
export type CompareRequest = ComparisonInput
export type CompareResponse = ComparisonResult

/** Shape of the browser-native platform API assembled in src/platform/api.ts. */
export interface ProseCombatApi {
  file: {
    /** Prompts for a project folder and lists the .md/.markdown files directly inside it. */
    openWorkspace(): Promise<OpenWorkspaceResult | null>
    /** Reads one of the files listed by openWorkspace(). */
    openFile(dirHandle: FileSystemDirectoryHandle, name: string): Promise<{ doc: OpenDocumentRef; content: string }>
    save(doc: OpenDocumentRef, content: string): Promise<void>
    /** Creates (or overwrites) `name` inside dirHandle and returns a ref to it. */
    createNew(dirHandle: FileSystemDirectoryHandle, name: string): Promise<{ doc: OpenDocumentRef; content: string }>
    /** Last workspace folder remembered across reloads, if permission can be silently reused. */
    reopenLastWorkspace(): Promise<OpenWorkspaceResult | null>
  }
  sidecar: {
    loadComments(doc: OpenDocumentRef): Promise<SidecarComments>
    saveComments(doc: OpenDocumentRef, data: SidecarComments): Promise<void>
    loadRevisions(doc: OpenDocumentRef): Promise<SidecarRevisions>
    saveRevisions(doc: OpenDocumentRef, data: SidecarRevisions): Promise<void>
  }
  credential: {
    has(): Promise<boolean>
    set(apiKey: string): Promise<void>
    clear(): Promise<void>
  }
  settings: {
    get(): Promise<AppSettings>
    set(settings: Partial<AppSettings>): Promise<AppSettings>
  }
  llm: {
    critique(input: CritiqueRequest): Promise<CritiqueResponse>
    compare(input: CompareRequest): Promise<CompareResponse>
  }
  window: {
    setFullScreen(fullscreen: boolean): Promise<void>
    isFullScreen(): Promise<boolean>
    /** Fires when fullscreen is entered/exited by any means, not just setFullScreen()
     *  calls made through this API — e.g. the OS-native Escape key. Returns an
     *  unsubscribe function. */
    onFullScreenChange(callback: (fullscreen: boolean) => void): () => void
  }
}
