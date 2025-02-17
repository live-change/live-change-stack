<template>
  <div class="w-full sm:w-full md:w-9/12 lg:w-7/12 bg-surface-0 dark:bg-surface-900 p-6 shadow rounded-border">
    <div class="text-center mb-8">
      <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">
        Urls List
      </div>
    </div>
    <p>{{ targetType }}</p>
    <UrlsList :targetType="targetType" />
  </div>
</template>

<script setup>
  import UrlsList from "./components/UrlsList.vue"

  const props = defineProps({
    targetType: {
      type: String,
      required: true
    }
  })

  import { toRefs } from '@vueuse/core'

  const { targetType } = toRefs(props)



</script>

<style scoped>

</style>
