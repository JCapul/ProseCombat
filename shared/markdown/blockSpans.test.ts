import { describe, it, expect } from 'vitest'
import { getTopLevelBlockSpans, splitDocumentWithGaps } from './blockSpans'

const SAMPLE = `# Title

This is the first paragraph. It has *emphasis* and **bold** text.

## A heading

- item one
- item two
- item three

> A blockquote
> spanning two lines.

\`\`\`ts
const x = 1

const y = 2
\`\`\`

Final paragraph.
`

describe('getTopLevelBlockSpans', () => {
  it('splits into one span per top-level block, preserving exact text', () => {
    const spans = getTopLevelBlockSpans(SAMPLE)
    expect(spans).toHaveLength(7)
    expect(spans[0]).toBe('# Title\n\n')
    expect(spans[1]).toContain('This is the first paragraph.')
    expect(spans[2]).toBe('## A heading\n\n')
    expect(spans[3]).toContain('item one')
    expect(spans[4]).toContain('A blockquote')
    expect(spans[5]).toContain('const x = 1')
    expect(spans[6]).toContain('Final paragraph.')
  })

  it('keeps blank lines inside a fenced code block as part of one span', () => {
    const spans = getTopLevelBlockSpans(SAMPLE)
    const codeSpan = spans.find((s) => s.includes('const x = 1'))
    expect(codeSpan).toContain('const y = 2')
    expect(codeSpan).toMatch(/^```ts/)
  })
})

describe('splitDocumentWithGaps', () => {
  it('reconstructs the original source exactly when spans and gaps are rejoined', () => {
    const { leading, spans, gaps, trailing } = splitDocumentWithGaps(SAMPLE)
    let rebuilt = leading
    spans.forEach((span, i) => {
      rebuilt += span
      if (i < gaps.length) rebuilt += gaps[i]
    })
    rebuilt += trailing
    expect(rebuilt).toBe(SAMPLE)
  })

  it('handles a document with no leading/trailing whitespace', () => {
    const src = 'One paragraph.\n\nAnother paragraph.'
    const { leading, spans, gaps, trailing } = splitDocumentWithGaps(src)
    expect(leading).toBe('')
    expect(spans).toHaveLength(2)
    expect(gaps).toHaveLength(1)
    expect(leading + spans[0] + gaps[0] + spans[1] + trailing).toBe(src)
  })
})
