import { promises as fs } from 'node:fs'
import {
  SidecarCommentsFileSchema,
  SidecarRevisionsFileSchema,
  emptyCommentsFile,
  emptyRevisionsFile,
  type SidecarCommentsFile,
  type SidecarRevisionsFile
} from '@shared/types/comments'
import { commentsSidecarPath, revisionsSidecarPath, writeFileAtomic, fileExists } from './markdownFile'

export async function loadComments(mdFilePath: string): Promise<SidecarCommentsFile> {
  const path = commentsSidecarPath(mdFilePath)
  if (!(await fileExists(path))) return emptyCommentsFile()
  const raw = await fs.readFile(path, 'utf-8')
  const parsed = SidecarCommentsFileSchema.safeParse(JSON.parse(raw))
  if (!parsed.success) {
    console.error('Corrupt comments sidecar, ignoring:', path, parsed.error)
    return emptyCommentsFile()
  }
  return parsed.data
}

export async function saveComments(mdFilePath: string, data: SidecarCommentsFile): Promise<void> {
  const path = commentsSidecarPath(mdFilePath)
  await writeFileAtomic(path, JSON.stringify(data, null, 2))
}

export async function loadRevisions(mdFilePath: string): Promise<SidecarRevisionsFile> {
  const path = revisionsSidecarPath(mdFilePath)
  if (!(await fileExists(path))) return emptyRevisionsFile()
  const raw = await fs.readFile(path, 'utf-8')
  const parsed = SidecarRevisionsFileSchema.safeParse(JSON.parse(raw))
  if (!parsed.success) {
    console.error('Corrupt revisions sidecar, ignoring:', path, parsed.error)
    return emptyRevisionsFile()
  }
  return parsed.data
}

export async function saveRevisions(mdFilePath: string, data: SidecarRevisionsFile): Promise<void> {
  const path = revisionsSidecarPath(mdFilePath)
  await writeFileAtomic(path, JSON.stringify(data, null, 2))
}
