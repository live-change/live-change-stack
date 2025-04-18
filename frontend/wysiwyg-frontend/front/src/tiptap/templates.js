export function previewContent(component, title) {
  return [
    {type: 'heading', attrs:{ level: 3 }, content: [{type: 'text', text: title || component.name }]},
    {type: 'paragraph', content: [{type: 'text', text: component.description }]}
  ]
}
export function initialContent(component, text) {
  return [
    {type: 'paragraph', content: [{type: 'text', text: text || (component.name + ' content') }]},
  ]
}

const templates = [
  {
    name: 'Card',
    description: 'PrimeVUE card',
    content({ preview } = {}) {
      return [{
        type: 'component',
        attrs: {
          is: 'div',
          attrs: {
            class: 'bg-surface-0 dark:bg-surface-900 py-1 px-4 shadow'
          }
        },
        content: preview ? previewContent(this) : initialContent(this)
      }]
    }
  },
  {
    name: 'Split',
    description: 'Two columns',
    content({ preview } = {}) {
      return [{
        type: 'component',
        attrs: {
          is: 'div',
          attrs: {
            class: 'flex flex-row flex-wrap'
          }
        },
        content: [
          {
            type: 'slot',
            attrs: {
              name: 'left',
              attrs: {
                class: preview ? 'w-6/12' : 'w-full md:w-6/12'
              }
            },
            content: preview ? previewContent(this, 'Left') : initialContent(this, 'left')
          },
          {
            type: 'slot',
            attrs: {
              name: 'right',
              attrs: {
                class: preview ? 'w-6/12' : 'w-full md:w-6/12'
              }
            },
            content: preview ? previewContent(this, 'Right') : initialContent(this, 'right')
          }
        ]
      }]
    }
  }
]

export default templates
