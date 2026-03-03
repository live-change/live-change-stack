import { syntaxTree } from '@codemirror/language'
import { Decoration } from '@codemirror/view'
import { decoratorStateField, isCursorInRange } from './util.js'

export function hideHeaderMarkPlugin() {
  return decoratorStateField(state => {
    const widgets = []
    syntaxTree(state).iterate({
      enter: ({ type, from, to }) => {
        if (!type.name.startsWith('ATXHeading')) return
        const line = state.sliceDoc(from, to)
        if (isCursorInRange(state, [from, to])) {
          widgets.push(
            Decoration.line({ class: 'cm-header-inside' }).range(from)
          )
          return
        }
        const spacePos = line.indexOf(' ')
        if (spacePos === -1) return
        widgets.push(
          Decoration.replace({
            inclusive: false
          }).range(from, from + spacePos + 1)
        )
      }
    })
    return Decoration.set(widgets, true)
  })
}

