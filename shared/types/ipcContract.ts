import type { SidecarCommentsFile, SidecarRevisionsFile } from './comments'
import type {
  CritiqueInput,
  CritiqueComment,
  ComparisonInput,
  ComparisonResult,
  ProviderId
} from './llmProvider'

export interface OpenFileResult {
  path: string
  content: string
}

export interface SaveFileArgs {
  path: string
  content: string
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

/** Shape of the API the preload script exposes on `window.api`. */
export interface ProseCombatApi {
  file: {
    open(): Promise<OpenFileResult | null>
    openPath(path: string): Promise<OpenFileResult>
    save(args: SaveFileArgs): Promise<{ path: string }>
    saveAs(args: SaveFileArgs): Promise<{ path: string } | null>
    'new'(): Promise<OpenFileResult>
  }
  sidecar: {
    loadComments(mdFilePath: string): Promise<SidecarComments>
    saveComments(mdFilePath: string, data: SidecarComments): Promise<void>
    loadRevisions(mdFilePath: string): Promise<SidecarRevisions>
    saveRevisions(mdFilePath: string, data: SidecarRevisions): Promise<void>
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
