<template>
  <ContentPreview objectType="content_Page" :object="pageId" :style="style" :class="clazz" />
</template>

<script setup>

  import ContentPreview from "./ContentPreview.vue";
  import { toRefs } from "@vueuse/core"

  const props = defineProps({
    pageId: {
      type: String,
      required: true
    },
    class: {
      type: String,
      default: ''
    },
    style: {
      type: String,
      default: ''
    }
  })
  const { pageId, class: clazz, style } = toRefs(props)
</script>

<style scoped>

</style>
