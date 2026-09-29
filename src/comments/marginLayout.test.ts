import { describe, it, expect } from 'vitest'
import { resolveOverlaps, CARD_GAP } from './marginLayout'

describe('resolveOverlaps', () => {
  it('leaves well-separated cards at their natural anchor position', () => {
    const entries = [
      { id: 'a', anchorTop: 0 },
      { id: 'b', anchorTop: 500 }
    ]
    const heights = new Map([
      ['a', 80],
      ['b', 80]
    ])
    const tops = resolveOverlaps(entries, heights)
    expect(tops.get('a')).toBe(0)
    expect(tops.get('b')).toBe(500)
  })

  it('pushes a card down when it would overlap the one above it', () => {
    const entries = [
      { id: 'a', anchorTop: 0 },
      { id: 'b', anchorTop: 20 } // would overlap a's 80px-tall card
    ]
    const heights = new Map([
      ['a', 80],
      ['b', 80]
    ])
    const tops = resolveOverlaps(entries, heights)
    expect(tops.get('a')).toBe(0)
    expect(tops.get('b')).toBe(80 + CARD_GAP)
  })

  it('cascades pushes through a chain of three overlapping cards', () => {
    const entries = [
      { id: 'a', anchorTop: 0 },
      { id: 'b', anchorTop: 10 },
      { id: 'c', anchorTop: 20 }
    ]
    const heights = new Map([
      ['a', 100],
      ['b', 100],
      ['c', 100]
    ])
    const tops = resolveOverlaps(entries, heights)
    expect(tops.get('a')).toBe(0)
    expect(tops.get('b')).toBe(100 + CARD_GAP)
    expect(tops.get('c')).toBe(2 * (100 + CARD_GAP))
  })

  it('falls back to anchorTop for a card with no measured height yet', () => {
    const entries = [{ id: 'a', anchorTop: 42 }]
    const tops = resolveOverlaps(entries, new Map())
    expect(tops.get('a')).toBe(42)
  })
})
