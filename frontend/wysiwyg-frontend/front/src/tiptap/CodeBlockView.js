import { Selection, TextSelection } from '@tiptap/pm/state'
import { EditorState as CMState } from '@codemirror/state';
import { EditorView as CMView, keymap as cmKeymap, drawSelection } from '@codemirror/view';
import {javascript} from "@codemirror/lang-javascript"
import {defaultKeymap} from "@codemirror/commands"
import {syntaxHighlighting, defaultHighlightStyle} from "@codemirror/language"

import {exitCode} from "@tiptap/pm/commands"
import {undo, redo} from "@tiptap/pm/history"

const computeChange = (oldVal, newVal) => {
  if (oldVal === newVal) {
    return null
  }
  let start = 0
  let oldEnd = oldVal.length
  let newEnd = newVal.length
  while (start < oldEnd && oldVal.charCodeAt(start) === newVal.charCodeAt(start)) {
    start += 1
  }
  while (oldEnd > start && newEnd > start && oldVal.charCodeAt(oldEnd - 1) === newVal.charCodeAt(newEnd - 1)) {
    oldEnd -= 1
    newEnd -= 1
  }
  return { from: start, to: oldEnd, text: newVal.slice(start, newEnd) }
}

class CodeBlockView {
  constructor(node, editor, getPos) {
    // Store for later
    this.node = node
    this.view = editor.view
    this.schema = editor.schema
    this.getPos = getPos

    this.language = node.attrs.language

    // This flag is used to avoid an update loop between the outer and
    // inner editor
    this.updating = false

    const changeFilter = CMState.changeFilter.of((tr) => {
      if (!tr.docChanged && !this.updating) {
        this.forwardSelection()
      }
      return true
    })

    // Select language plugin
    let languagePlugins = []
    switch(this.language) {
      case 'javascript':
        languagePlugins.push(javascript())
        break
      default:
        break
    }

    // Create a CodeMirror instance
    this.cm = new CMView({
      dispatch: this.dispatch.bind(this),
    })
    // The editor's outer node is our DOM representation
    this.dom = this.cm.dom

    const cmState = CMState.create({
      doc: this.node.textContent,
      extensions: [
        changeFilter,
        cmKeymap.of([
          ...this.codeMirrorKeymap(),
          ...defaultKeymap
        ]),
        drawSelection(),
        syntaxHighlighting(defaultHighlightStyle),
        ...languagePlugins,
      ],
    })

    this.cm.setState(cmState)
  }

  forwardSelection() {
    if (!this.cm.hasFocus) {
      return;
    }

    const { state } = this.view;
    const selection = this.asProseMirrorSelection(state.doc)

    if (!selection.eq(state.selection)) {
      this.view.dispatch(state.tr.setSelection(selection))
    }
  }

  asProseMirrorSelection(doc) {
    const offset = this.getPos() + 1
    const { anchor, head } = this.cm.state.selection.main
    return TextSelection.create(doc, anchor + offset, head + offset)
  }

  dispatch(cmTr) {
    this.cm.setState(cmTr.state);

    if (cmTr.docChanged && !this.updating) {
      const start = this.getPos() + 1
      const cmValue = cmTr.state.doc.toString()
      const change = computeChange(this.node.textContent, cmValue)
      if (!change) {
        return
      }
      const content = change.text ? this.view.state.schema.text(change.text) : null
      const tr = this.view.state.tr.replaceWith(change.from + start, change.to + start, content)
      this.view.dispatch(tr)
      this.forwardSelection()
    }
  }

  maybeEscape(unit, dir) {
    return (view) => {
      const { state } = view
      const { selection } = state
      console.log("maybeEscape", unit, dir, "AT", selection.from, selection.to)
      const offsetToPos = () => {
        const offset = selection.main.from
        const line = state.doc.lineAt(offset)
        return { line: line.number, ch: offset - line.from }
      };
      const pos = offsetToPos()
      const hasSelection = state.selection.ranges.some((r) => !r.empty)
      const firstLine = 1
      const lastLine = state.doc.lineAt(state.doc.length).number
      if (
        hasSelection
        || pos.line !== (dir < 0 ? firstLine : lastLine)
        || (unit === 'char' && pos.ch !== (dir < 0 ? 0 : state.doc.line(pos.line).length))
      ) return false
      const targetPos = this.getPos() + (dir < 0 ? 0 : this.node.nodeSize)
      const pmSelection = Selection.near(this.view.state.doc.resolve(targetPos), dir)
      this.view.dispatch(this.view.state.tr.setSelection(pmSelection).scrollIntoView())
      this.view.focus()
      return true
    }
  }

  codeMirrorKeymap() {
    let view = this.view
    return [
      { key: "ArrowUp", run: this.maybeEscape("line", -1)},
      { key: "ArrowLeft", run: this.maybeEscape("char", -1)},
      { key: "ArrowDown", run: this.maybeEscape("line", 1)},
      { key: "ArrowRight", run: this.maybeEscape("char", 1)},
      { key: "Ctrl-Enter", run: () => {
          if (!exitCode(view.state, view.dispatch)) return false
          view.focus()
          return true
        }},
      { key: "Ctrl-z", mac: "Cmd-z", run: () => undo(view.state, view.dispatch) },
      { key: "Shift-Ctrl-z", mac: "Shift-Cmd-z", run: () => redo(view.state, view.dispatch) },
      { key: "Ctrl-y", mac: "Cmd-y", run: () => redo(view.state, view.dispatch) }
    ]
  }

  update(node) {
    if (node.type != this.node.type) return false
    if (node.attrs.language != this.language) return false
    //if (this.updating) return true
    this.node = node
    const change = computeChange(this.cm.state.doc.toString(), node.textContent)
    if (change) {
      this.updating = true
      this.cm.dispatch({
        changes: { from: change.from, to: change.to, insert: change.text },
      })
      this.updating = false
    }
    return true
  }

  focus() {
    this.cm.focus()
    this.forwardSelection()
  }

  selectNode() {
    this.focus()
  }

  stopEvent() {
    return true
  }

  destroy() {
    this.cm.destroy()
  }
}


export default CodeBlockView
