<template>
  <UrlContent objectType="blog_Post" :path="urlPath" :class="clazz" :style="style" />
</template>

<script setup>

  import { toRefs } from "@vueuse/core"
  import { UrlContent } from "@live-change/content-frontend";

  const props = defineProps({
    path: {
      type: String,
      required: true
    },
    class: {},
    style: {}
  })
  const { path: urlPath, class: clazz, style } = toRefs(props)

</script>

<style scoped>

</style>
