<template>
  <div class="flex flex-row">
    <div class="font-semibold">
      Made:
    </div>
    <div v-for="part in result"
         :class="`bg-yellow-200 px-1 mx-2 border-round`">
      <span>{{ part.woodType }}</span>
      <span class="ml-1">plank</span>
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