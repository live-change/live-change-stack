<template>
  <div class="w-full sm:w-full md:w-9/12 lg:w-7/12 bg-surface-0 dark:bg-surface-900 p-6 shadow rounded-border">
    <div class="text-center mb-8">
      <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">
        Pages list
      </div>
    </div>
    <UrlsList targetType="content_Page" edit-buttons />
  </div>
</template>

<script setup>

  import { UrlsList } from "@live-change/url-frontend"

</script>

<style scoped>

</style>
