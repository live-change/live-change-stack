<template>

  <ContentPreview objectType="blog_Post" :object="postId" :style="style" :class="clazz" />

</template>

<script setup>

  import { ContentPreview } from "@live-change/content-frontend"
  import { toRefs } from "@vueuse/core"

  const props = defineProps({
    postId: {
      type: String,
      required: true
    },
    class: {},
    style: {}
  })
  const { postId, class: clazz, style } = toRefs(props)

</script>

<style scoped>

</style>
