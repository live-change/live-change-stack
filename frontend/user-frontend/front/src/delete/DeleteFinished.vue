<template>
  <div class="w-full lg:w-6/12 md:w-9/12 max-w-[32rem]" v-shared-element:form="{ duration: '300ms', includeChildren: true }">
    <div class="bg-surface-0 dark:bg-surface-900 p-6 shadow rounded-border">
      <div class="text-center mb-8">
        <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">{{ t('deleteAccount.accountDeleted') }}</div>
      </div>

      <div class="mb-4">
        {{ t('deleteAccount.feedbackRequest') }}
      </div>

      <Textarea class="w-full" :autoResize="true" rows="4" cols="30" />
      <div class="flex flex-row items-end">
        <Button :label="t('deleteAccount.send')" icon="pi pi-send" class="ml-auto p-button-lg"></Button>
      </div>

    </div>
  </div>
</template>

<script setup>
  import InputText from "primevue/inputtext"
  import Checkbox from "primevue/checkbox"
  import Button from "primevue/button"
  import Divider from "primevue/divider"
  import Textarea from "primevue/textarea"

  import { useI18n } from 'vue-i18n'
  const { t } = useI18n()

</script>

<style>

</style>
