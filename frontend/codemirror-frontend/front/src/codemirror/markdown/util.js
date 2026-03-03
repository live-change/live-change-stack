import { Decoration, EditorView } from '@codemirror/view'
import { StateField, RangeSet } from '@codemirror/state'

export function isCursorInRange(state, [from, to]) {
  const { from: selFrom, to: selTo } = state.selection.main
  return !(selTo <= from || selFrom >= to)
}

export function decoratorStateField(build) {
  return StateField.define({
    create(state) {
      return build(state)
    },
    update(deco, tr) {
      if (tr.docChanged || tr.selection) {
        return build(tr.state)
      }
      return deco.map(tr.changes)
    },
    provide: field => EditorView.decorations.from(field)
  })
}

export const invisibleDecoration = Decoration.replace({})

export const emptyRangeSet = RangeSet.empty

