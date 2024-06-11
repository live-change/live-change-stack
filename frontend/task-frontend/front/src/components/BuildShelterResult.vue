<template>
  <div class="flex flex-row justify-content-between flex-wrap">
    <div class="font-semibold">
      Built shelter with:
    </div>
    <div v-for="part in result.walls"
         :class="`bg-gray-200 px-1 mx-2 border-round`">
      <span>Wall</span>
      <span class="ml-1">({{ part.size }})</span>
    </div>
    <div v-for="part in [result.roof]"
         :class="`bg-gray-200 px-1 mx-2 border-round`">
      <span>Roof</span>
      <span class="ml-1">({{ part.size }})</span>
    </div>
  </div>
</template>

<script setup>
  import { defineProps, toRefs } from 'vue'

  const props = defineProps({
    result: {
      type: Object,
      required: true
    },
    task: {
      type: Object,
      default: () => ({})
    },
    taskType: {
      type: Object,
      default: () => ({})
    }
  })

  const { result } = toRefs(props)
</script>

<style scoped>

</style>