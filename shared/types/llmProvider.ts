import { z } from 'zod'
import { CritiqueCategorySchema, CritiqueSeveritySchema } from './comments'

export const CritiqueInputSchema = z.object({
  documentText: z.string(),
  selectionRange: z.object({ start: z.number().int(), end: z.number().int() }).optional(),
  mode: CritiqueCategorySchema
})
export type CritiqueInput = z.infer<typeof CritiqueInputSchema>

export const CritiqueCommentSchema = z.object({
  start: z.number().int().nonnegative(),
  end: z.number().int().nonnegative(),
  category: CritiqueCategorySchema,
  severity: CritiqueSeveritySchema,
  comment: z.string()
})
export type CritiqueComment = z.infer<typeof CritiqueCommentSchema>

export const CritiqueResultSchema = z.object({
  comments: z.array(CritiqueCommentSchema)
})
export type CritiqueResult = z.infer<typeof CritiqueResultSchema>

export const ComparisonInputSchema = z.object({
  originalPassage: z.string(),
  originalComment: z.string(),
  revisedPassage: z.string()
})
export type ComparisonInput = z.infer<typeof ComparisonInputSchema>

export const ComparisonResultSchema = z.object({
  resolved: z.boolean(),
  explanation: z.string(),
  newIssues: z.array(z.string())
})
export type ComparisonResult = z.infer<typeof ComparisonResultSchema>

/**
 * Structural guarantee for "fresh-context" comparison (idea.md §8): this interface
 * has no session/history parameter anywhere, so a conforming implementation cannot
 * thread prior conversation state into compare() even by accident.
 */
export interface LLMProvider {
  readonly id: string
  critique(input: CritiqueInput): Promise<CritiqueResult>
  compare(input: ComparisonInput): Promise<ComparisonResult>
}

export type ProviderId = 'anthropic'

export const AVAILABLE_PROVIDERS: { id: ProviderId; label: string }[] = [
  { id: 'anthropic', label: 'Anthropic' }
]

export const ANTHROPIC_MODELS = [
  { id: 'claude-opus-5-5', label: 'Claude Opus 5.5 (highest quality, slower/costlier)' },
  { id: 'claude-sonnet-5', label: 'Claude Sonnet 5 (recommended)' },
  { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5 (fast, cheap)' }
] as const
