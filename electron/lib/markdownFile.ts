import { dirname, join, basename } from 'node:path'
import { promises as fs } from 'node:fs'
import { randomUUID } from 'node:crypto'

const SIDECAR_DIR_NAME = '.ai-editor'

export function sidecarDir(mdFilePath: string): string {
  return join(dirname(mdFilePath), SIDECAR_DIR_NAME)
}

function sidecarPath(mdFilePath: string, suffix: 'comments.json' | 'revisions.json'): string {
  const base = basename(mdFilePath).replace(/\.md$/i, '')
  return join(sidecarDir(mdFilePath), `${base}.${suffix}`)
}

export function commentsSidecarPath(mdFilePath: string): string {
  return sidecarPath(mdFilePath, 'comments.json')
}

export function revisionsSidecarPath(mdFilePath: string): string {
  return sidecarPath(mdFilePath, 'revisions.json')
}

/** Atomic write: write to a temp file in the same directory, then rename over the target. */
export async function writeFileAtomic(targetPath: string, content: string): Promise<void> {
  await fs.mkdir(dirname(targetPath), { recursive: true })
  const tempPath = join(dirname(targetPath), `.${basename(targetPath)}.${randomUUID()}.tmp`)
  await fs.writeFile(tempPath, content, 'utf-8')
  await fs.rename(tempPath, targetPath)
}

export async function readMarkdownFile(path: string): Promise<string> {
  return fs.readFile(path, 'utf-8')
}

export async function writeMarkdownFile(path: string, content: string): Promise<void> {
  await writeFileAtomic(path, content)
}

export async function fileExists(path: string): Promise<boolean> {
  try {
    await fs.access(path)
    return true
  } catch {
    return false
  }
}
