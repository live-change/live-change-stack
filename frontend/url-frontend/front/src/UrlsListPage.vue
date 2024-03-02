<template>
  <div class="w-full sm:w-12 md:w-9 lg:w-7 surface-card p-4 shadow-2 border-round">
    <div class="text-center mb-5">
      <div class="text-900 text-3xl font-medium mb-3">
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
