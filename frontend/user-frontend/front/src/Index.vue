<template>
  <div class="w-full lg:w-6/12 md:w-9/12">
    <div class="bg-surface-0 dark:bg-surface-900 rounded-border shadow p-6">
      <div class="text-surface-900 dark:text-surface-0 text-red-500 font-medium mb-4 text-xl">{{ t('common.testIndex') }}</div>
      <div>
        <Button @click="testNotification" :label="t('common.addTestNotification')" />
      </div>
    </div>
  </div>
</template>

<script setup>

  import { useApi } from '@live-change/vue3-ssr'
  import { useI18n } from 'vue-i18n'
  const { t } = useI18n()

  const api = useApi()

  function testNotification() {
    api.actions.notification.testNotification({ })
  }

</script>

<style scoped>

</style>