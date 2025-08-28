<template>  
  <div class="flex flex-row items-center">
    <i  class="pi pi-linkedin mr-2"></i>
    <span class="block text-surface-900 dark:text-surface-0 font-medium text-lg">{{ account.name }}</span>
  </div>
</template>

<script setup>  
  import { toRefs, computed, defineProps } from 'vue'

  const props = defineProps({
    account: {
      type: Object,
      required: true
    }
  })

  const { account } = toRefs(props)
</script>