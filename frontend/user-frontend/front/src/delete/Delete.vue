<template>
  <div class="w-full lg:w-6/12 md:w-9/12 max-w-[32rem]" v-shared-element:form="{ duration: '300ms', includeChildren: true }">

    <div class="bg-surface-0 dark:bg-surface-900 p-6 shadow rounded-border">
      <div class="text-center mb-8">
        <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">{{ t('deleteAccount.deleteAccount') }}</div>
      </div>

      <div v-if="client.user">
        <p>
          {{ t('deleteAccount.warning') }}
        </p>
        <div class="p-field-checkbox mb-4">
          <Checkbox id="deleteCheckbox" v-model="wantDelete" :binary="true" />
          <label for="deleteCheckbox" class="ml-2">{{ t('deleteAccount.confirmCheckbox') }}</label>
        </div>

        <Button id="delete" :label="t('deleteAccount.deleteAccount')" icon="pi pi-user-minus" class="p-button-lg"
                :disabled="!wantDelete" @click="deleteUser" />
      </div>
      <div v-else>
        {{ t('deleteAccount.alreadyDeleted') }}
      </div>
    </div>
  </div>
</template>

<script setup>
  import Checkbox from "primevue/checkbox"
  import Button from "primevue/button"

  import { actions } from "@live-change/vue3-ssr"
  import { inject, ref } from 'vue'
  import { useRouter } from 'vue-router'
  const router = useRouter()
  import { useClient } from '@live-change/vue3-ssr'
  const client = useClient()

  import { useI18n } from 'vue-i18n'
  const { t } = useI18n()

  const workingZone = inject('workingZone')

  const wantDelete = ref(false)

  const { deleteMe } = actions().user

  function deleteUser() {
    if(!wantDelete.value) return
    workingZone.addPromise('deleteMe', (async () => {
      await deleteMe()
      router.push({ name: 'user:deleteFinished' })
    })())
  }

</script>

<style>

</style>
