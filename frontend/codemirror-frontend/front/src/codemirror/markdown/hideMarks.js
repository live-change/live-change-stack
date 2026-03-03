import { syntaxTree } from '@codemirror/language'
import { Decoration } from '@codemirror/view'
import { decoratorStateField, invisibleDecoration, isCursorInRange } from './util.js'

const typesWithMarks = [
  'Emphasis',
  'StrongEmphasis',
  'InlineCode',
  'Strikethrough',
  'Superscript',
  'Subscript'
]

const markTypes = [
  'EmphasisMark',
  'CodeMark',
  'StrikethroughMark',
  'SuperscriptMark',
  'SubscriptMark'
]

export function hideMarksPlugin() {
  return decoratorStateField(state => {
    const widgets = []
    let parentRange
    syntaxTree(state).iterate({
      enter: ({ type, from, to, node }) => {
        if (!typesWithMarks.includes(type.name)) return
        if (parentRange && rangesOverlap([from, to], parentRange)) return
        parentRange = [from, to]
        if (isCursorInRange(state, [from, to])) return
        const inner = node.toTree()
        inner.iterate({
          enter: ({ type, from: markFrom, to: markTo }) => {
            if (!markTypes.includes(type.name)) return
            widgets.push(
              invisibleDecoration.range(from + markFrom, from + markTo)
            )
          }
        })
      }
    })
    return Decoration.set(widgets, true)
  })
}

function rangesOverlap([aFrom, aTo], [bFrom, bTo]) {
  return aFrom < bTo && bFrom < aTo
}

