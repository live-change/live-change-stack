import { h } from 'vue'
import { Image } from "@live-change/image-frontend"
import { parser as javascriptParser } from "@lezer/javascript"
import { highlightTree } from "@lezer/highlight"
import { defaultHighlightStyle } from "@codemirror/language"

export const basicMarks = {
  bold: (m, c) => h('strong', {}, [ c ]),
  italic: (m, c) => h('em', {}, [ c ]),
  underline: (m, c) => h('u', {}, [ c ]),
  strike: (m, c) => h('s', {}, [ c ]),
  link: (m, c) => h('a', {
    href: m.attrs.href,
    target: m.attrs.target || '_blank',
    rel: 'noopener noreferrer nofollow'
  }, [c]),
}

export const plainTextNodes = {
  doc: ({ content }, r) => h('div', { 'class': 'content' }, r(content)),

  paragraph: ({ content }, r) => h('p', { }, r(content)),

  text({ text, marks: ms }, r, marks) {
    let res = text
    if(ms) for(const mark of ms) {
      const renderer = marks[mark.type]
      if(!renderer) {
        res = h('span', { style: 'color: red' }, `[unknown mark type ${mark.type}]`)
      } else {
        res = renderer(mark, res)
      }
    }
    return res
  }
}

export const messageNodes = {
  ...plainTextNodes,

  hardBreak: ({ content }) => h('br')
}

export const richEditorNodes = {
  horizontalRule: ({ content }) => h('hr'),

  heading: ({ content, attrs }, r) => h('h'+(+attrs.level), { }, r(content)),
  blockquote: ({ content }, r) => h('blockquote', { }, r(content)),
  codeBlock:  ({ content }, r) => {
    const code = (content ?? []).map(t => t.text).join('')
    const tree = javascriptParser.parse(code)
    let pos = 0
    let output = []
    highlightTree(tree, defaultHighlightStyle, (from, to, classes) => {
      if(from > pos) output.push(h('span', { }, code.slice(pos, from)))
      //console.log("HIGHLIGHT", from, to, classes, code.slice(from, to))
      output.push(h('span', { class: classes }, code.slice(from, to)))
      pos = to
    })
    if(code.length > pos) output.push(h('span', { }, code.slice(pos)))
    return h('pre', { }, h('code', { }, output))
  },

  bulletList: ({ content }, r) => h('ul', { }, r(content)),
  orderedList: ({ content }, r) => h('ol', { }, r(content)),
  listItem: ({ content }, r) => h('li', { }, r(content)),

  image: ({ attrs }) => h(Image, { domResize: 'width', width: 100, class: 'w-full', ...attrs }),

  ...messageNodes
}

import components from './components.js'

export const pageNodes = {
  ...richEditorNodes,

  component: (params, r) => {
    return components[params.attrs.is].render(params, r)
  },
  slot: ({ content, attrs }, r) => {
    /// component slots are not rendered, they are just placeholders, other slots rendered as divs
    return h(attrs.tag ?? 'div', { ...attrs.attrs }, r(content))
  }
}
