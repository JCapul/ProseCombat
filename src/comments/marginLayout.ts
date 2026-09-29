export interface AnchoredCard {
  id: string
  anchorTop: number
}

export const CARD_GAP = 10

/**
 * Cards are first placed at their natural anchor position, then pushed down
 * greedily (in anchor order) so none overlaps the one above it. `entries` must
 * already be sorted by `anchorTop` ascending.
 */
export function resolveOverlaps(entries: AnchoredCard[], heights: Map<string, number>): Map<string, number> {
  const tops = new Map<string, number>()
  let cursor = -Infinity
  for (const entry of entries) {
    const height = heights.get(entry.id) ?? 0
    const top = Math.max(entry.anchorTop, cursor)
    tops.set(entry.id, top)
    cursor = top + height + CARD_GAP
  }
  return tops
}
