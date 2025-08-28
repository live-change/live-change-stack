<template>  
  <div class="flex flex-row items-center">
    <i  class="pi pi-question-circle mr-2"></i>
    <span class="block text-surface-900 dark:text-surface-0 font-medium text-lg">{{ cleanAccountInfo }}</span>
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

  const cleanAccountInfo = computed(() => {
    if(!account.value) return "Unknown account"
    const { accountType, ...rest } = account.value
    return { ...rest, accountType: accountType.accountType }
  })
</script>