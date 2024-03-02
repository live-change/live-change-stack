import { Node } from '@tiptap/core'
import CodeBlockView from "./CodeBlockView.js"

import "./code-block-node.scss"

function arrowHandler(dir) {
  return (state, dispatch, view) => {
    if (state.selection?.empty && view.endOfTextblock(dir)) {
      let side = dir == "left" || dir == "up" ? -1 : 1
      let $head = state.selection.$head
      let nextPos = Selection.near(
        state.doc.resolve(side > 0 ? $head.after() : $head.before()), side)
      if (nextPos.$head && nextPos.$head.parent.type.name == "code_block") {
        dispatch(state.tr.setSelection(nextPos))
        return true
      }
    }
    return false
  }
}

export default Node.create({
  name: 'codeBlock',
  group: 'block',
  atom: false,
  inline: false,
  selectable: true,
  draggable: true,
  content: 'text*',
  marks: '',

  addAttributes() {
    return {
      language: {
        rendered: false,
        default: 'text'
      },
    }
  },

  /*parseHTML() {
    return [
      {
        tag: this.options.allowBase64
            ? 'img[src]'
            : 'img[src]:not([src^="data:"])',
      },
    ]
  },*/

  renderHTML({ }) {
    return ['img', {}]
  },

  addNodeView() {
    return (args) => {
      const { editor, node, getPos } = args
      return new CodeBlockView(node, editor, getPos)
    }
  },

  addCommands() {
    return {
      setCodeBlock: attributes => ({ commands }) => {
        console.log("SET CODE BLOCK", attributes)
        return commands.setNode(this.name, attributes)
      },
      toggleCodeBlock: attributes => ({ commands }) => {
        return commands.toggleNode(this.name, 'paragraph', attributes)
      },
    }
  },

  addKeyboardShortcuts() {
    return {
      ArrowLeft: arrowHandler("left"),
      ArrowRight: arrowHandler("right"),
      ArrowUp: arrowHandler("up"),
      ArrowDown: arrowHandler("down")
    }
  }
})
