import { marked } from 'marked'

/**
 * Splits raw Markdown source into its top-level block tokens and returns the exact
 * original substring ("raw") for each one, in document order.
 *
 * This is the foundation of the minimal-diff save path (see src/editor/blockTracking):
 * at load time we correlate each of these spans, by index, with the corresponding
 * top-level ProseMirror node the markdown parser produces. If a block is never edited
 * during the session, its original bytes are spliced back into the saved file verbatim
 * instead of being re-serialized — which avoids reformatting untouched content even
 * when the serializer's style conventions (emphasis marker, list bullet, etc.) differ
 * from what the author originally wrote.
 *
 * Uses `marked`'s own CommonMark-ish lexer (the same parser @tiptap/markdown is built
 * on) rather than a hand-rolled splitter, so block boundaries (fenced code, lists,
 * blockquotes, headings) match real Markdown semantics instead of a blank-line heuristic.
 */
export function getTopLevelBlockSpans(source: string): string[] {
  const tokens = marked.lexer(source, { gfm: true })
  // marked emits a separate 'space' token for the blank-line run between blocks —
  // that's exactly the inter-block whitespace splitDocumentWithGaps below recovers
  // independently (from the source text itself), so it's excluded from the block list.
  return tokens.filter((token) => token.type !== 'space' && token.raw.length > 0).map((token) => token.raw)
}

export interface SplitDocument {
  /** Text before the first block (normally empty). */
  leading: string
  /** Each top-level block's exact original text, in document order. */
  spans: string[]
  /** Raw text between spans[i] and spans[i+1]; length === spans.length - 1. */
  gaps: string[]
  /** Text after the last block (normally empty or a trailing newline). */
  trailing: string
}

/**
 * Same block boundaries as getTopLevelBlockSpans, but also captures the exact
 * whitespace between blocks so it can be preserved on save (see
 * src/editor/blockTracking) instead of being normalized to a single blank line.
 */
export function splitDocumentWithGaps(source: string): SplitDocument {
  const spans = getTopLevelBlockSpans(source)
  const gaps: string[] = []
  let cursor = 0
  let leading = ''

  for (let i = 0; i < spans.length; i++) {
    const idx = source.indexOf(spans[i], cursor)
    if (idx === -1) {
      // Should not happen since spans came from lexing this exact source, but degrade
      // gracefully rather than throw: treat the remainder as an opaque trailing chunk.
      return { leading, spans: spans.slice(0, i), gaps, trailing: source.slice(cursor) }
    }
    if (i === 0) {
      leading = source.slice(0, idx)
    } else {
      gaps.push(source.slice(cursor, idx))
    }
    cursor = idx + spans[i].length
  }

  const trailing = source.slice(cursor)
  return { leading, spans, gaps, trailing }
}
