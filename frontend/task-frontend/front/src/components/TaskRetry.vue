<template>
  <div class="mt-0 ml-4">
    <div class="flex flex-row items-center">
      <div class="text-red-600 dark:text-red-400">
        {{ index + 1 }}. {{ retry.error }}
        <span class="text-gray-600 dark:text-gray-400">at {{ d(retry.failedAt, 'shortestTime') }}</span>
      </div>
      <i 
        v-if="retry.stack"
        :class="['pi', isExpanded ? 'pi-chevron-up' : 'pi-chevron-down', 'text-sm cursor-pointer ml-2']"
        @click="isExpanded = !isExpanded"
      />
    </div>
    <pre v-if="retry.stack && isExpanded" class="text-xs text-red-800 dark:text-red-300 bg-red-50 dark:bg-red-900/30 p-2 rounded mt-1 overflow-x-auto whitespace-pre">{{ retry.stack }}</pre>
  </div>
</template>

<script setup>
  import { ref } from 'vue'
  import { useI18n } from 'vue-i18n'

  const { d } = useI18n()

  const props = defineProps({
    retry: {
      type: Object,
      required: true
    },
    index: {
      type: Number,
      required: true
    }
  })

  const isExpanded = ref(false)
</script> 