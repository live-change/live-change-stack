<template>
  <div class="wysiwyg">
    <DocumentEditor targetType="Example" :target="target" :type="'page'" :purpose="'test'"
                    :initialContent="emptyContent"
                    :config="contentConfig" />
  </div>
</template>

<script setup>

  import DocumentEditor from "./components/DocumentEditor.vue"
  import { ref } from 'vue'
  import { basicMarks, messageNodes, richEditorNodes, pageNodes } from "./tiptap/contentConfig.js"
  import { toRefs } from '@vueuse/core'

  const props = defineProps({
    target: {
      type: String,
      default: 'one'
    }
  })

  const { target } = toRefs(props)

  const contentConfig = {
    marks: {
      ...basicMarks
    },
    nodes: {
      //...messageNodes,
      //...richEditorNodes
      ...pageNodes
    }
  }

  const emptyContent = {
    "type": "doc",
    "content": [
      {
        "type": "paragraph",
        "content": [
          {
            "type": "text",
            "text": "test"
          },
          {
            "type": "text",
            "marks": [
              {
                "type": "bold"
              }
            ],
            "text": "est"
          }
        ]
      },
      {
        "type": "component",
        "attrs": {
          "is": "card",
          "attrs": {
            "class": "bg-surface-0 dark:bg-surface-900 px-4 shadow w-full f p-2"
          }
        },
        "content": [
          {
            "type": "paragraph",
            "content": [
              {
                "type": "text",
                "text": "test"
              }
            ]
          }
        ]
      },
      {
        "type": "paragraph",
        "content": [
          {
            "type": "text",
            "text": "test"
          },
          {
            "type": "text",
            "marks": [
              {
                "type": "bold"
              }
            ],
            "text": "est"
          }
        ]
      },
      {
        "type": "component",
        "attrs": {
          "is": "card",
          "attrs": {
            "class": "bg-surface-0 dark:bg-surface-900 py-1 px-4 shadow w-full"
          }
        },
        "content": [
          {
            "type": "paragraph",
            "content": [
              {
                "type": "text",
                "text": "test"
              }
            ]
          }
        ]
      }
    ]
  }

</script>

<style lang="scss">
  .wysiwyg {

    .ProseMirror:focus {
      outline: none;
    }

  }
</style>
