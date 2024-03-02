import { h, ref } from 'vue'
import Button from "primevue/button"
import { toRefs } from '@vueuse/core'

function renderNode(node, r, marks, nodes) {
  const renderer = nodes[node.type]
  if(!renderer) return h('div', { style: 'color: red' }, `[unknown node type ${node.type}]`)
  return renderer(node, r, marks, nodes)
}

function ContentView(props, context) {
  let { content, config } = props
  if(content) {
    const doc = typeof content == 'string' ? JSON.parse(content) : content
    const r = nodes => nodes?.map(n => renderNode(n, r, config.marks, config.nodes))
    return renderNode(doc, r, config.marks, config.nodes)
  }
  return h('div', {}, [
    h('h1', {}, 'Empty document'),
  ])

}

export default ContentView
