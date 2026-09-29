import type { Node as PMNode } from '@tiptap/pm/model'
import type { Anchor, Comment } from '@shared/types/comments'

export interface ReanchorResult {
  status: 'active' | 'detached'
  from?: number
  to?: number
}

const FUZZY_SIMILARITY_THRESHOLD = 0.6

function diceCoefficient(a: string, b: string): number {
  const bigrams = (s: string): string[] => {
    const norm = s.toLowerCase().replace(/\s+/g, ' ').trim()
    const out: string[] = []
    for (let i = 0; i < norm.length - 1; i++) out.push(norm.slice(i, i + 2))
    return out
  }
  const bigramsA = bigrams(a)
  const bigramsB = bigrams(b)
  if (bigramsA.length === 0 || bigramsB.length === 0) return a === b ? 1 : 0
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

function findAllOccurrences(haystack: string, needle: string): number[] {
  if (needle.length === 0) return []
  const positions: number[] = []
  let idx = haystack.indexOf(needle)
  while (idx !== -1) {
    positions.push(idx)
    idx = haystack.indexOf(needle, idx + 1)
  }
  return positions
}

/**
 * Re-anchors a stored comment against the current document text, using the four-step
 * strategy from idea.md §13: exact offset, verbatim search, fuzzy prefix/suffix
 * matching, then detached. `docText` should be `doc.textBetween(0, doc.content.size)`
 * (or equivalent plain-text projection) for the currently loaded ProseMirror doc.
 */
export function reanchorComment(anchor: Anchor, docText: string): ReanchorResult {
  // 1. Exact offset
  if (anchor.end <= docText.length && docText.slice(anchor.start, anchor.end) === anchor.selectedText) {
    return { status: 'active', from: anchor.start, to: anchor.end }
  }

  // 2. Verbatim search
  const occurrences = findAllOccurrences(docText, anchor.selectedText)
  if (occurrences.length === 1) {
    const start = occurrences[0]
    return { status: 'active', from: start, to: start + anchor.selectedText.length }
  }

  if (occurrences.length > 1) {
    // Disambiguate multiple verbatim matches using prefix/suffix context.
    let best: { start: number; score: number } | null = null
    for (const start of occurrences) {
      const end = start + anchor.selectedText.length
      const actualPrefix = docText.slice(Math.max(0, start - anchor.prefix.length), start)
      const actualSuffix = docText.slice(end, end + anchor.suffix.length)
      const score = diceCoefficient(actualPrefix, anchor.prefix) + diceCoefficient(actualSuffix, anchor.suffix)
      if (!best || score > best.score) best = { start, score }
    }
    if (best) {
      return { status: 'active', from: best.start, to: best.start + anchor.selectedText.length }
    }
  }

  // 3. Fuzzy prefix/suffix matching: slide a window the length of selectedText across
  // the document and score candidates by how well their surrounding context matches.
  const windowLen = anchor.selectedText.length
  if (windowLen > 0 && windowLen <= docText.length) {
    let best: { start: number; score: number } | null = null
    for (let start = 0; start <= docText.length - windowLen; start++) {
      const candidate = docText.slice(start, start + windowLen)
      const textScore = diceCoefficient(candidate, anchor.selectedText)
      if (textScore < 0.3) continue // cheap prefilter before the more expensive context check
      const actualPrefix = docText.slice(Math.max(0, start - anchor.prefix.length), start)
      const actualSuffix = docText.slice(start + windowLen, start + windowLen + anchor.suffix.length)
      const contextScore =
        (diceCoefficient(actualPrefix, anchor.prefix) + diceCoefficient(actualSuffix, anchor.suffix)) / 2
      const score = textScore * 0.6 + contextScore * 0.4
      if (!best || score > best.score) best = { start, score }
    }
    if (best && best.score >= FUZZY_SIMILARITY_THRESHOLD) {
      return { status: 'active', from: best.start, to: best.start + windowLen }
    }
  }

  // 4. Detached
  return { status: 'detached' }
}

export interface ReanchoredComment {
  comment: Comment
  from?: number
  to?: number
}

export function reanchorAllComments(comments: Comment[], doc: PMNode): ReanchoredComment[] {
  const docText = doc.textBetween(0, doc.content.size, '\n', '\n')
  return comments.map((comment) => {
    const result = reanchorComment(comment.anchor, docText)
    const status = result.status === 'active' ? 'active' : 'detached'
    return {
      comment: comment.status === 'resolved' || comment.status === 'dismissed' ? comment : { ...comment, status },
      from: result.from,
      to: result.to
    }
  })
}
