<template>
  <div class="w-full sm:w-12 md:w-9 lg:w-7 surface-card p-4 shadow-2 border-round">
    <div class="text-center mb-5">
      <div class="text-900 text-3xl font-medium mb-3">
        Blog posts list
      </div>
    </div>
    <UrlsList targetType="blog_Post" edit-buttons />
  </div>
</template>

<script setup>

  import { UrlsList } from "@live-change/url-frontend"

</script>

<style scoped>

</style>
