import type {
  SidecarCommentsFile,
  SidecarRevisionsFile
} from '@shared/types/comments'
import {
  SidecarCommentsFileSchema,
  SidecarRevisionsFileSchema,
  emptyCommentsFile,
  emptyRevisionsFile
} from '@shared/types/comments'
import type { OpenDocumentRef, OpenWorkspaceResult } from '@shared/types/platformContract'
import { idbGet, idbSet } from './idb'

const SIDECAR_DIR_NAME = '.ai-editor'
const LAST_WORKSPACE_KEY = 'lastWorkspaceDirHandle'
const MARKDOWN_EXTENSION = /\.(md|markdown)$/i

async function ensurePermission(
  handle: FileSystemHandle,
  mode: FileSystemPermissionMode
): Promise<void> {
  if ((await handle.queryPermission({ mode })) === 'granted') return
  if ((await handle.requestPermission({ mode })) === 'granted') return
  throw new Error('Permission was not granted for this file or folder.')
}

async function listMarkdownFiles(dirHandle: FileSystemDirectoryHandle): Promise<string[]> {
  const names: string[] = []
  for await (const [name, handle] of dirHandle.entries()) {
    if (handle.kind === 'file' && MARKDOWN_EXTENSION.test(name)) names.push(name)
  }
  return names.sort((a, b) => a.localeCompare(b))
}

export async function openWorkspace(): Promise<OpenWorkspaceResult | null> {
  let dirHandle: FileSystemDirectoryHandle
  try {
    dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') return null
    throw err
  }
  await idbSet(LAST_WORKSPACE_KEY, dirHandle)
  return { dirHandle, files: await listMarkdownFiles(dirHandle) }
}

/** Read-only peek at the remembered workspace's name, with no permission prompt — safe to
 *  call on mount, purely to label a "Reopen <name>" button before the user clicks it. */
export async function peekLastWorkspaceName(): Promise<string | null> {
  const dirHandle = await idbGet<FileSystemDirectoryHandle>(LAST_WORKSPACE_KEY)
  return dirHandle?.name ?? null
}

export async function reopenLastWorkspace(): Promise<OpenWorkspaceResult | null> {
  const dirHandle = await idbGet<FileSystemDirectoryHandle>(LAST_WORKSPACE_KEY)
  if (!dirHandle) return null
  try {
    await ensurePermission(dirHandle, 'readwrite')
  } catch {
    return null
  }
  return { dirHandle, files: await listMarkdownFiles(dirHandle) }
}

export async function openFile(
  dirHandle: FileSystemDirectoryHandle,
  name: string
): Promise<{ doc: OpenDocumentRef; content: string }> {
  const fileHandle = await dirHandle.getFileHandle(name)
  const content = await (await fileHandle.getFile()).text()
  return { doc: { name, fileHandle, dirHandle }, content }
}

export async function createNew(
  dirHandle: FileSystemDirectoryHandle,
  name: string
): Promise<{ doc: OpenDocumentRef; content: string }> {
  const fileHandle = await dirHandle.getFileHandle(name, { create: true })
  const content = await (await fileHandle.getFile()).text()
  return { doc: { name, fileHandle, dirHandle }, content }
}

export async function save(doc: OpenDocumentRef, content: string): Promise<void> {
  await ensurePermission(doc.fileHandle, 'readwrite')
  const writable = await doc.fileHandle.createWritable()
  await writable.write(content)
  await writable.close()
}

function sidecarBaseName(name: string): string {
  return name.replace(MARKDOWN_EXTENSION, '')
}

async function getSidecarDirHandle(
  dirHandle: FileSystemDirectoryHandle,
  options: { create: boolean }
): Promise<FileSystemDirectoryHandle | null> {
  try {
    return await dirHandle.getDirectoryHandle(SIDECAR_DIR_NAME, options)
  } catch (err) {
    if (err instanceof DOMException && err.name === 'NotFoundError') return null
    throw err
  }
}

async function readSidecarFile(
  doc: OpenDocumentRef,
  suffix: 'comments.json' | 'revisions.json'
): Promise<string | null> {
  const sidecarDir = await getSidecarDirHandle(doc.dirHandle, { create: false })
  if (!sidecarDir) return null
  try {
    const fileHandle = await sidecarDir.getFileHandle(`${sidecarBaseName(doc.name)}.${suffix}`)
    return await (await fileHandle.getFile()).text()
  } catch (err) {
    if (err instanceof DOMException && err.name === 'NotFoundError') return null
    throw err
  }
}

async function writeSidecarFile(
  doc: OpenDocumentRef,
  suffix: 'comments.json' | 'revisions.json',
  content: string
): Promise<void> {
  const sidecarDir = await getSidecarDirHandle(doc.dirHandle, { create: true })
  if (!sidecarDir) throw new Error('Could not create the .ai-editor sidecar folder.')
  const fileHandle = await sidecarDir.getFileHandle(`${sidecarBaseName(doc.name)}.${suffix}`, {
    create: true
  })
  const writable = await fileHandle.createWritable()
  await writable.write(content)
  await writable.close()
}

export async function loadComments(doc: OpenDocumentRef): Promise<SidecarCommentsFile> {
  const raw = await readSidecarFile(doc, 'comments.json')
  if (raw === null) return emptyCommentsFile()
  const parsed = SidecarCommentsFileSchema.safeParse(JSON.parse(raw))
  if (!parsed.success) {
    console.error('Corrupt comments sidecar, ignoring:', parsed.error)
    return emptyCommentsFile()
  }
  return parsed.data
}

export async function saveComments(doc: OpenDocumentRef, data: SidecarCommentsFile): Promise<void> {
  await writeSidecarFile(doc, 'comments.json', JSON.stringify(data, null, 2))
}

export async function loadRevisions(doc: OpenDocumentRef): Promise<SidecarRevisionsFile> {
  const raw = await readSidecarFile(doc, 'revisions.json')
  if (raw === null) return emptyRevisionsFile()
  const parsed = SidecarRevisionsFileSchema.safeParse(JSON.parse(raw))
  if (!parsed.success) {
    console.error('Corrupt revisions sidecar, ignoring:', parsed.error)
    return emptyRevisionsFile()
  }
  return parsed.data
}

export async function saveRevisions(doc: OpenDocumentRef, data: SidecarRevisionsFile): Promise<void> {
  await writeSidecarFile(doc, 'revisions.json', JSON.stringify(data, null, 2))
}
