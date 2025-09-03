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

  import { useI18n } from 'vue-i18n'
  const { t } = useI18n()

  const cleanAccountInfo = computed(() => {
    if(!account.value) return t('connected.unknownAccount')
    const { accountType, ...rest } = account.value
    return { ...rest, accountType: accountType.accountType }
  })
</script>