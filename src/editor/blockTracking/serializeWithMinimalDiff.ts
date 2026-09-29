import { splitDocumentWithGaps, getTopLevelBlockSpans } from '@shared/markdown/blockSpans'

export interface MinimalDiffSaveParams {
  /** The exact text the file had when it was opened (or last saved). */
  originalSource: string
  /** editor.getMarkdown()'s current output for the whole document. */
  freshFullMarkdown: string
  /** One entry per original top-level block, from the block-tracking plugin. */
  dirtyFlags: boolean[]
}

/**
 * Produces the text to write to disk: untouched blocks are spliced back in using their
 * original bytes (byte-identical), edited blocks use the freshly serialized markdown.
 * Falls back to the plain fresh serialization if the document's top-level block count no
 * longer matches what was tracked (e.g. a block was split, merged, inserted, or removed)
 * — safe (never corrupts content), just not minimal-diff for that particular save.
 */
export function serializeWithMinimalDiff(params: MinimalDiffSaveParams): string {
  const original = splitDocumentWithGaps(params.originalSource)
  const freshSpans = getTopLevelBlockSpans(params.freshFullMarkdown)

  if (freshSpans.length !== original.spans.length || freshSpans.length !== params.dirtyFlags.length) {
    return params.freshFullMarkdown
  }

  const outSpans = freshSpans.map((span, i) => (params.dirtyFlags[i] ? span : original.spans[i]))

  let result = original.leading
  outSpans.forEach((span, i) => {
    result += span
    if (i < original.gaps.length) result += original.gaps[i]
  })
  result += original.trailing
  return result
}
