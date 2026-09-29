import { describe, it, expect } from 'vitest'
import { reanchorComment } from './reanchor'
import type { Anchor } from '@shared/types/comments'

function makeAnchor(docText: string, start: number, end: number, contextLen = 20): Anchor {
  return {
    selectedText: docText.slice(start, end),
    prefix: docText.slice(Math.max(0, start - contextLen), start),
    suffix: docText.slice(end, end + contextLen),
    start,
    end
  }
}

describe('reanchorComment', () => {
  it('strategy 1: exact offset still valid when nothing changed', () => {
    const doc = 'The quick brown fox jumps over the lazy dog.'
    const needle = 'quick brown fox'
    const start = doc.indexOf(needle)
    const anchor = makeAnchor(doc, start, start + needle.length)
    const result = reanchorComment(anchor, doc)
    expect(result.status).toBe('active')
    expect(result.from).toBe(start)
    expect(result.to).toBe(start + needle.length)
  })

  it('strategy 2: verbatim search when text shifted but is still unique', () => {
    const original = 'Intro. The quick brown fox jumps over the lazy dog.'
    const needle = 'quick brown fox'
    const start = original.indexOf(needle)
    const anchor = makeAnchor(original, start, start + needle.length)
    const edited = 'A new intro sentence was added. The quick brown fox jumps over the lazy dog.'
    const result = reanchorComment(anchor, edited)
    expect(result.status).toBe('active')
    expect(edited.slice(result.from!, result.to!)).toBe(needle)
  })

  it('strategy 2b: disambiguates duplicate verbatim matches using prefix/suffix', () => {
    const original = 'First: the answer is clear. Second: the answer is clear too.'
    // start/end deliberately wrong so strategy 1 (exact offset) cannot accidentally
    // succeed — this test exercises disambiguation among multiple verbatim matches.
    const anchor: Anchor = {
      selectedText: 'the answer',
      prefix: 'Second: ',
      suffix: ' is clear too.',
      start: 0,
      end: 0
    }
    const result = reanchorComment(anchor, original)
    expect(result.status).toBe('active')
    expect(result.from).toBeDefined()
    expect(result.to).toBeDefined()
    expect(original.slice(result.from!, result.to!)).toBe('the answer')
    // Should land on the SECOND occurrence, matched via its distinctive suffix.
    expect(original.slice(result.to!, result.to! + 14)).toBe(' is clear too.')
  })

  it('strategy 3: fuzzy match tolerates a small edit inside the selected span', () => {
    const original = 'The committee reviewed the proposal and rejected it outright.'
    const needle = 'reviewed the proposal and rejected it'
    const start = original.indexOf(needle)
    const anchor = makeAnchor(original, start, start + needle.length)
    const edited = 'The committee reviewed the proposal and rejected it firmly, outright.'
    const result = reanchorComment(anchor, edited)
    expect(result.status).toBe('active')
  })

  it('strategy 4: detaches when the passage is gone entirely', () => {
    const original = 'This paragraph will be deleted soon.'
    const anchor = makeAnchor(original, 0, original.length)
    const edited = 'A completely different document with no relation to the original text at all.'
    const result = reanchorComment(anchor, edited)
    expect(result.status).toBe('detached')
  })
})
