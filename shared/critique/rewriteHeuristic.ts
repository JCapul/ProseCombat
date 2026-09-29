import type { CritiqueComment } from '@shared/types/llmProvider'

/**
 * The system prompt asks the model never to smuggle rewritten prose inside a comment,
 * but that's a request, not a guarantee. This independently flags comments that look
 * like they contain a proposed replacement passage, so the app can withhold them rather
 * than silently trusting the model to have followed instructions (idea.md §10).
 *
 * This is a heuristic starting point, expected to need tuning against real usage — see
 * the "Remaining Risks" section of the implementation plan.
 */

const REWRITE_SIGNAL_PATTERNS: RegExp[] = [
  /instead,?\s+(try|write|say)/i,
  /could\s+(instead\s+)?read/i,
  /consider\s+(writing|phrasing|saying)/i,
  /suggested\s+(version|rewrite|phrasing)/i,
  /rewrite\s*:/i,
  /try\s*:/i,
  /replace\s+(it|this)\s+with/i
]

const LONG_COMMENT_CHAR_CEILING = 600
const QUOTED_SPAN_WORD_THRESHOLD = 8

function longQuotedSpanNotInOriginal(comment: string, originalPassage: string): boolean {
  const quoted = comment.match(/["“]([^"”]{20,})["”]/g) ?? []
  return quoted.some((q) => {
    const stripped = q.slice(1, -1)
    const wordCount = stripped.trim().split(/\s+/).length
    return wordCount >= QUOTED_SPAN_WORD_THRESHOLD && !originalPassage.includes(stripped)
  })
}

function diceCoefficient(a: string, b: string): number {
  const bigrams = (s: string): string[] => {
    const norm = s.toLowerCase().replace(/\s+/g, ' ').trim()
    const out: string[] = []
    for (let i = 0; i < norm.length - 1; i++) out.push(norm.slice(i, i + 2))
    return out
  }
  const bigramsA = bigrams(a)
  const bigramsB = bigrams(b)
  if (bigramsA.length === 0 || bigramsB.length === 0) return 0
  const counts = new Map<string, number>()
  for (const bg of bigramsA) counts.set(bg, (counts.get(bg) ?? 0) + 1)
  let overlap = 0
  for (const bg of bigramsB) {
    const remaining = counts.get(bg) ?? 0
    if (remaining > 0) {
      overlap++
      counts.set(bg, remaining - 1)
    }
  }
  return (2 * overlap) / (bigramsA.length + bigramsB.length)
}

const SIMILARITY_THRESHOLD = 0.4

export interface RewriteFlagResult {
  flagged: boolean
  reasons: string[]
}

export function checkForSmuggledRewrite(
  comment: CritiqueComment,
  originalPassage: string
): RewriteFlagResult {
  const reasons: string[] = []

  if (REWRITE_SIGNAL_PATTERNS.some((re) => re.test(comment.comment))) {
    reasons.push('contains a rewrite-signaling phrase')
  }

  if (longQuotedSpanNotInOriginal(comment.comment, originalPassage)) {
    reasons.push('quotes a long span of invented prose not present in the original passage')
  }

  if (comment.comment.length > LONG_COMMENT_CHAR_CEILING) {
    reasons.push(`unusually long for an explanation (${comment.comment.length} chars)`)
  }

  if (originalPassage.length > 0 && diceCoefficient(comment.comment, originalPassage) > SIMILARITY_THRESHOLD) {
    reasons.push('text closely overlaps with the original passage, as a rewrite would')
  }

  return { flagged: reasons.length > 0, reasons }
}

export interface FilteredCritiqueComments {
  accepted: CritiqueComment[]
  withheld: (CritiqueComment & { reasons: string[] })[]
}

export function filterCritiqueComments(
  comments: CritiqueComment[],
  documentText: string
): FilteredCritiqueComments {
  const accepted: CritiqueComment[] = []
  const withheld: (CritiqueComment & { reasons: string[] })[] = []

  for (const comment of comments) {
    const originalPassage = documentText.slice(comment.start, comment.end)
    const result = checkForSmuggledRewrite(comment, originalPassage)
    if (result.flagged) {
      withheld.push({ ...comment, reasons: result.reasons })
    } else {
      accepted.push(comment)
    }
  }

  return { accepted, withheld }
}
