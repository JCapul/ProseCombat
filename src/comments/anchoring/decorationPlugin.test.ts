import { describe, it, expect } from 'vitest'
import { Schema } from '@tiptap/pm/model'
import { EditorState } from '@tiptap/pm/state'
import { commentDecorationPluginKey, createCommentDecorationPlugin, getLivePositions } from './decorationPlugin'

const schema = new Schema({
  nodes: {
    doc: { content: 'paragraph+' },
    paragraph: { content: 'text*', toDOM: () => ['p', 0] },
    text: { group: 'inline' }
  }
})

function makeState(): EditorState {
  const doc = schema.node('doc', null, [
    schema.node('paragraph', null, [schema.text('hello world this is a test document')])
  ])
  return EditorState.create({ doc, plugins: [createCommentDecorationPlugin()] })
}

describe('commentDecorationPlugin', () => {
  it('adds and later removes a position via meta, leaving others untouched', () => {
    let state = makeState()

    let tr = state.tr.setMeta(commentDecorationPluginKey, {
      type: 'setPositions',
      positions: [
        { id: 'a', from: 1, to: 6 },
        { id: 'b', from: 7, to: 12 }
      ]
    })
    state = state.apply(tr)
    expect(getLivePositions(commentDecorationPluginKey.getState(state)).map((p) => p.id).sort()).toEqual([
      'a',
      'b'
    ])

    // Simulate what happens on "Dismiss": the position for one comment is removed.
    tr = state.tr.setMeta(commentDecorationPluginKey, { type: 'removePositions', ids: ['a'] })
    state = state.apply(tr)

    const remaining = getLivePositions(commentDecorationPluginKey.getState(state))
    expect(remaining.map((p) => p.id)).toEqual(['b'])
  })

  it('removing an id that was never present is a harmless no-op', () => {
    let state = makeState()
    const tr = state.tr.setMeta(commentDecorationPluginKey, { type: 'removePositions', ids: ['nonexistent'] })
    state = state.apply(tr)
    expect(getLivePositions(commentDecorationPluginKey.getState(state))).toEqual([])
  })

  it('a highlight decoration disappears from the rendered set once removed', () => {
    let state = makeState()
    let tr = state.tr.setMeta(commentDecorationPluginKey, {
      type: 'setPositions',
      positions: [{ id: 'a', from: 1, to: 6 }]
    })
    state = state.apply(tr)
    expect(commentDecorationPluginKey.getState(state)?.decorations.find().length).toBe(1)

    tr = state.tr.setMeta(commentDecorationPluginKey, { type: 'removePositions', ids: ['a'] })
    state = state.apply(tr)
    expect(commentDecorationPluginKey.getState(state)?.decorations.find().length).toBe(0)
  })
})
