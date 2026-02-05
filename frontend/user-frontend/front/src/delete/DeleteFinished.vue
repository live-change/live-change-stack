<template>
  <div class="w-full lg:w-6/12 md:w-9/12 max-w-[32rem]" 
       v-shared-element:form="{ duration: '300ms', includeChildren: true }">
    <div class="bg-surface-0 dark:bg-surface-900 p-6 shadow rounded-border">
      <div class="text-center mb-8">
        <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">
          {{ t('deleteAccount.accountDeleted') }}
        </div>
      </div>

      <div class="mb-4">
        {{ t('deleteAccount.feedbackRequest') }}
      </div>
      <command-form v-if="isMounted" service="feedback" action="leaveFeedback" v-slot="{ data }"
                    :parameters="{ type: 'delete', userAgent: ua }"
                    @done="handleDone">

        <Textarea v-model="data.content" class="w-full" :autoResize="true" rows="4" cols="30" :error="data.contentError" />
        <small v-if="data.contentError" class="text-red-500 dark:text-red-400">
          {{ t(`errors.${data.contentError}`) }}
        </small>

        <div class="flex flex-row items-end">
          <Button type="submit" :label="t('deleteAccount.send')" icon="pi pi-send" class="ml-auto p-button-lg" />
        </div>
      </command-form>      

    </div>
  </div>
</template>

<script setup>
  import Button from "primevue/button"
  import Textarea from "primevue/textarea"

  import { useI18n } from 'vue-i18n'
  const { t } = useI18n()

  import { onMounted, ref } from "vue"
  const isMounted = ref(false)
  onMounted(() => isMounted.value = true)

  import { useToast } from 'primevue/usetoast'
  const toast = useToast()

  const ua = ref()
  onMounted(() => {
    ua.value = navigator.userAgent
  })

  function handleDone({ parameters, result }) {
    console.log("DONE PARAMETERS", parameters)
    console.log("DONE RESULT", result)
    toast.add({
      severity: 'info', life: 6000,
      summary: t('deleteAccount.feedbackSent'),
      detail: t('deleteAccount.thankYou')
    })
    router.push({ name: 'user:deleteFeedbackSent' })
  }

</script>

<style>

</style>
