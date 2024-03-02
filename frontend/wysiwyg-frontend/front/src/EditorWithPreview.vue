<template>
  <div>
    <div class="grid w-full">
      <div class="col relative">
        <Editor v-model="content" :config="contentConfig" />
      </div>
      <div class="col relative">
        <ContentView :content="content" :config="contentConfig" />
      </div>
    </div>

    <pre>{{ JSON.stringify(JSON.parse(content), null, '  ') }}</pre>
  </div>

</template>

<script setup>
  import ContentView from "./components/ContentView.js"
  import Editor from "./components/Editor.vue"
  import { ref } from 'vue'
  import { basicMarks, messageNodes, richEditorNodes } from "./tiptap/contentConfig.js"

  const contentConfig = {
    marks: {
      ...basicMarks
    },
    nodes: {
      //...messageNodes,
      ...richEditorNodes
    }
  }

  const content = ref(JSON.stringify({
    "type": "doc",
    "content": [    {
      "type": "image",
      "attrs": {
        "image": "[Wc6GBWx5c.0@1V6ZJBwyF_1I98X_]"
      }
    }].concat(new Array(2).fill(
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
      }
    ))
  }))
</script>

<style scoped>

</style>
