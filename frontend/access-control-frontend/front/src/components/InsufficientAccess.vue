<template>
  <div class="flex items-start p-6 bg-pink-100 rounded-border border border-pink-300 mb-6">
    <i class="pi pi-times-circle text-pink-900 text-2xl mr-4" />
    <div class="mr-4">
      <div class="text-pink-900 font-medium text-xl mb-4 leading-none">{{ t('access.notAuthorized') }}</div>
      <p class="m-0 p-0 text-pink-700">
        {{ t('access.insufficientPrivileges') }}
      </p>
    </div>
  </div>
</template>

<script setup>
  import { useI18n } from 'vue-i18n'
  const { t } = useI18n()
</script>

<style scoped>

</style>
