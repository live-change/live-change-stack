<template>
  <div class="w-full lg:w-6/12 md:w-9/12 max-w-[32rem]" v-shared-element:form="{ duration: '300ms', includeChildren: true }">
    <div class="bg-surface-0 dark:bg-surface-900 rounded-border shadow p-6">
      <div class="text-surface-900 dark:text-surface-0 font-medium mb-4 text-xl mb-6">{{ t('auth.passwordChanged') }}</div>
      <p class="mt-0 p-0 leading-normal">{{ t('auth.passwordChangedSuccess') }}</p>
    </div>
  </div>
</template>

<script setup>
  import { useI18n } from 'vue-i18n'
  const { t } = useI18n()
</script>

<style>

</style>
