import { Node } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import ImageComponent from "./ImageComponent.vue"

export default Node.create({
  name: 'image',
  group: 'block',
  atom: true,
  inline: false,
  selectable: true,
  draggable: true,
  content: '',
  marks: '',

  addAttributes() {
    return {
      image: {
        rendered: false
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
    return VueNodeViewRenderer(ImageComponent)
  },

  addCommands() {
    return {
      setImage: options => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: options
        })
      }
    }
  }
})
