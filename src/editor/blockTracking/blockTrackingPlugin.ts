import { Plugin, PluginKey } from '@tiptap/pm/state'
import type { Node as PMNode } from '@tiptap/pm/model'

export interface TrackedBlock {
  from: number
  to: number
  dirty: boolean
}

interface BlockTrackingState {
  blocks: TrackedBlock[]
}

export const blockTrackingPluginKey = new PluginKey<BlockTrackingState>('blockTracking')

function initialBlocksFromDoc(doc: PMNode): TrackedBlock[] {
  const blocks: TrackedBlock[] = []
  doc.forEach((node, offset) => {
    blocks.push({ from: offset, to: offset + node.nodeSize, dirty: false })
  })
  return blocks
}

/**
 * Tracks, per top-level block present when the document was loaded, whether any
 * subsequent edit touched it. Positions are kept current via ProseMirror's step
 * mapping; overlap is checked one step at a time (rather than against the transaction's
 * combined mapping) so multi-step transactions are handled correctly.
 *
 * This plugin deliberately never uses the tracked from/to to *extract* text — only to
 * decide whether a block is still eligible for the minimal-diff splice on save (see
 * serializeWithMinimalDiff.ts). That keeps it safe even across edits that split or merge
 * blocks, which can make the original block count and the live document's block count
 * diverge: in that case the save path simply falls back to full re-serialization instead
 * of guessing at a slice that might not exist anymore.
 */
export function createBlockTrackingPlugin(): Plugin<BlockTrackingState> {
  return new Plugin<BlockTrackingState>({
    key: blockTrackingPluginKey,
    state: {
      init(_config, state) {
        return { blocks: initialBlocksFromDoc(state.doc) }
      },
      apply(tr, value) {
        if (!tr.docChanged) return value
        const blocks = value.blocks.map((b) => ({ ...b }))

        tr.mapping.maps.forEach((stepMap) => {
          stepMap.forEach((oldStart, oldEnd) => {
            for (const block of blocks) {
              if (block.from < oldEnd && block.to > oldStart) {
                block.dirty = true
              }
            }
          })
          for (const block of blocks) {
            block.from = stepMap.map(block.from, -1)
            block.to = stepMap.map(block.to, 1)
          }
        })

        return { blocks }
      }
    }
  })
}

export function getDirtyFlags(state: BlockTrackingState | undefined): boolean[] {
  return (state?.blocks ?? []).map((b) => b.dirty)
}
