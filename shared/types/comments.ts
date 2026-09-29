import { z } from 'zod'

export const AnchorSchema = z.object({
  selectedText: z.string(),
  prefix: z.string(),
  suffix: z.string(),
  start: z.number().int().nonnegative(),
  end: z.number().int().nonnegative()
})
export type Anchor = z.infer<typeof AnchorSchema>

export const CritiqueCategorySchema = z.enum(['general', 'argument', 'structure', 'prose'])
export type CritiqueCategory = z.infer<typeof CritiqueCategorySchema>

export const CritiqueSeveritySchema = z.enum(['low', 'medium', 'high'])
export type CritiqueSeverity = z.infer<typeof CritiqueSeveritySchema>

export const CommentStatusSchema = z.enum(['active', 'detached', 'resolved', 'dismissed'])
export type CommentStatus = z.infer<typeof CommentStatusSchema>

export const CommentSchema = z.object({
  id: z.string(),
  anchor: AnchorSchema,
  category: CritiqueCategorySchema,
  severity: CritiqueSeveritySchema,
  comment: z.string(),
  createdAt: z.string(),
  status: CommentStatusSchema
})
export type Comment = z.infer<typeof CommentSchema>

export const RevisionEvaluationSchema = z.object({
  id: z.string(),
  commentId: z.string(),
  evaluatedAt: z.string(),
  originalPassage: z.string(),
  originalComment: z.string(),
  revisedPassage: z.string(),
  resolved: z.boolean(),
  explanation: z.string(),
  newIssues: z.array(z.string())
})
export type RevisionEvaluation = z.infer<typeof RevisionEvaluationSchema>

export const SIDECAR_SCHEMA_VERSION = 1

export const SidecarCommentsFileSchema = z.object({
  schemaVersion: z.literal(SIDECAR_SCHEMA_VERSION),
  comments: z.array(CommentSchema)
})
export type SidecarCommentsFile = z.infer<typeof SidecarCommentsFileSchema>

export const SidecarRevisionsFileSchema = z.object({
  schemaVersion: z.literal(SIDECAR_SCHEMA_VERSION),
  revisions: z.array(RevisionEvaluationSchema)
})
export type SidecarRevisionsFile = z.infer<typeof SidecarRevisionsFileSchema>

export function emptyCommentsFile(): SidecarCommentsFile {
  return { schemaVersion: SIDECAR_SCHEMA_VERSION, comments: [] }
}

export function emptyRevisionsFile(): SidecarRevisionsFile {
  return { schemaVersion: SIDECAR_SCHEMA_VERSION, revisions: [] }
}
