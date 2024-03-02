import { h } from 'vue'

const components = {
  card: {
    attrs: [],
    render: ({ content, attrs }, r) =>  h('div', { ...attrs.attrs }, r(content)),
    editor: (attrs, { slots }) => h('div', { ...attrs }, slots.default()),
    async: true
  },
  div: {
    attrs: [],
    render: ({ content, attrs }, r) => h('div', { ...attrs.attrs }, r(content)),
    editor: (attrs, { slots }) => h('div', { ...attrs }, slots.default()),
    editorClass: (attrs) => [],
    editorContentClass: (attrs) => [attrs.class],
    async: true
  }
}

export default components
