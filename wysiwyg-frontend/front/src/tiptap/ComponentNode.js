import { Node, mergeAttributes } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import ComponentComponent from "./ComponentComponent.vue"

export default Node.create({
  name: 'component',
  group: 'block',
  //atom: true,
  inline: false,
  selectable: true,
  draggable: true,
  content: '(block | slot)*',
  marks: '',

  addAttributes() {
    return {
      is: {
        default: 'card',
        renderHTML: attributes => {
          return {
            'data-is': attributes.is
          }
        },
      },
      attrs: {
        default: {},
        renderHTML: attributes => {
          const htmlAttrs = {}
          const attrs = attributes.attrs
          for(let key in this.options) {
            htmlAttrs[`data-attr-${key}`] = attrs[key]
          }
          return htmlAttrs
        },
      }
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

  renderHTML({ HTMLAttributes }) {
    /*const htmlAttrs = {}
    const attrs = this.options.attrs
    for(let key in this.options) {
      htmlAttrs[`data-attr-${key}`] = attrs[key]
    }
    htmlAttrs['data-is'] = this.options.is
    return ['component', mergeAttributes(HTMLAttributes, htmlAttrs)]*/
    return ['component', HTMLAttributes, 0]
  },

  addNodeView() {
    return VueNodeViewRenderer(ComponentComponent)
  },

  addCommands() {
    return {

    }
  }
})
