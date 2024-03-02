import { Node, mergeAttributes } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import ComponentComponent from "./ComponentComponent.vue"

export default Node.create({
  name: 'slot',
  group: 'slot',
  //atom: true,
  inline: false,
  selectable: false,
  draggable: false,
  content: 'block*',
  marks: '',

  addAttributes() {
    return {
      name: {
        default: 'default',
        renderHTML: attributes => {
          return {
            'data-name': attributes.name
          }
        },
      },
      tag: {
        default: 'div',
        renderHTML: attributes => {
          return {
            'data-tag': attributes.tag
          }
        }
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

  renderHTML({ HTMLAttributes, node }) {
    const slotAttributes = {
      ...node.attrs.attrs,
      'data-slot': node.attrs.name
    }
    return [node.attrs.tag, mergeAttributes(HTMLAttributes, slotAttributes), 0]
  }
})
