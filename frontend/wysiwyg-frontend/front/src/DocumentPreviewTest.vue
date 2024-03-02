<template>
  <ContentView :content="document.content" :config="contentConfig" class="w-full" />
  <pre>{{ JSON.stringify(document.content, null, "  ") }}</pre>
</template>

<script setup>
  import ContentView from "./components/ContentView.js"
  import { ref } from 'vue'

  const props = defineProps({
    target: {
      type: String,
      default: 'one'
    }
  })

  import { basicMarks, messageNodes, richEditorNodes, pageNodes } from "./tiptap/contentConfig.js"

  const contentConfig = {
    marks: {
      ...basicMarks
    },
    nodes: {
      //...messageNodes,
      //...richEditorNodes,
      ...pageNodes
    }
  }

  import { path, live, useApi } from '@live-change/vue3-ssr'
  const api = useApi()
  const p = path()

  const document = await live(
    p.prosemirror.document({ targetType: 'Example', target: props.target })
  )


</script>

<style scoped>

</style>
