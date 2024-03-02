<template>
<!--  <pre>{{ JSON.stringify(content, null, "  ") }}</pre>-->
  <ContentView :content="JSON.stringify(content?.content)" :config="contentConfig" />
</template>

<script setup>
  import { ContentView } from "@live-change/wysiwyg-frontend"
  import contentConfig from "./contentConfig.js"

  const props = defineProps({
    objectType: {
      type: String,
      required: true
    },
    object: {
      type: String,
      required: true
    },
    preview: {
      type: Boolean,
      default: false
    }
  })

  import { computed, ref, onMounted } from 'vue'
  import { path, live } from '@live-change/vue3-ssr'

  const isMounted = ref(false)
  onMounted(() => isMounted.value = true)

  const p = path()
  const liveContentPath = computed(() =>
    props.preview
      ? p.content.contentPreview({ objectType: props.objectType, object: props.object })
      : p.content.content({ objectType: props.objectType, object: props.object })
  )

  const [content] = await Promise.all([
    live(liveContentPath)
  ])

</script>

<style scoped>

</style>
