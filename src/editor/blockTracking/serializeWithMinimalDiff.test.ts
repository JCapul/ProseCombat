import { describe, it, expect } from 'vitest'
import { serializeWithMinimalDiff } from './serializeWithMinimalDiff'

const ORIGINAL = `# My Essay

This is *hand-written* emphasis using asterisks.

Second paragraph, unedited.
`

describe('serializeWithMinimalDiff', () => {
  it('keeps untouched blocks byte-identical even if the serializer would reformat them', () => {
    // Simulates a serializer that normalizes *emphasis* to _emphasis_ — if the block
    // were considered "changed" this would leak into the saved file.
    const freshFullMarkdown = `# My Essay

This is _hand-written_ emphasis using asterisks.

Second paragraph, unedited.
`
    const result = serializeWithMinimalDiff({
      originalSource: ORIGINAL,
      freshFullMarkdown,
      dirtyFlags: [false, false, false]
    })
    expect(result).toBe(ORIGINAL)
  })

  it('uses the fresh serialization only for blocks marked dirty', () => {
    const freshFullMarkdown = `# My Essay

This is _hand-written_ emphasis using asterisks, now edited.

Second paragraph, unedited.
`
    const result = serializeWithMinimalDiff({
      originalSource: ORIGINAL,
      freshFullMarkdown,
      dirtyFlags: [false, true, false]
    })
    expect(result).toContain('This is _hand-written_ emphasis using asterisks, now edited.')
    expect(result).toContain('# My Essay')
    expect(result).toContain('Second paragraph, unedited.')
    // Untouched heading block still byte-identical to original, not fresh
    expect(result.startsWith('# My Essay\n\n')).toBe(true)
  })

  it('falls back to the full fresh markdown when block count changed', () => {
    const freshFullMarkdown = `# My Essay

This is _hand-written_ emphasis using asterisks.

A brand new paragraph was inserted here.

Second paragraph, unedited.
`
    const result = serializeWithMinimalDiff({
      originalSource: ORIGINAL,
      freshFullMarkdown,
      dirtyFlags: [false, false, false] // stale flags, count no longer matches
    })
    expect(result).toBe(freshFullMarkdown)
  })
})
