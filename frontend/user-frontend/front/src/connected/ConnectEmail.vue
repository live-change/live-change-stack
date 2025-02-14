<template>
  <div class="w-full lg:w-6/12 md:w-9/12" v-shared-element:form="{ duration: '300ms', includeChildren: true }">
    <div class="bg-surface-0 dark:bg-surface-900 p-6 shadow rounded-border">
      <div class="text-center mb-8">
        <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">Add email</div>
      </div>

      <command-form service="messageAuthentication" action="connectEmail" v-slot="{ data }"
                    @done="handleSent" keepOnDone>

        <div class="p-field mb-4">
          <label for="email" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">
            Email address
          </label>
          <InputText id="email" type="text" class="w-full"
                     aria-describedby="email-help" :class="{ 'p-invalid': data.emailError}"
                     v-model="data.email" />
          <small v-if="data.emailError" id="email-help" class="p-error">{{ t(`errors.${data.emailError}`) }}</small>
        </div>

        <Button label="Add Email" icon="pi pi-envelope" class="w-full" type="submit" />

        <Divider align="center" class="my-6">
          <span class="text-surface-600 dark:text-surface-200 font-normal text-sm">OR</span>
        </Divider>

        <router-link :to="{ name: 'user:connect-phone' }">
          <Button label="Add Phone" icon="pi pi-mobile" class="w-full p-button-secondary mb-2" />
        </router-link>

<!--        <Button label="Connect GitHub account" icon="pi pi-github" class="w-full p-button-secondary mb-2"></Button>
        <Button label="Connect Google account" icon="pi pi-google" class="w-full p-button-secondary mb-1"></Button>-->

      </command-form>
    </div>
  </div>
</template>

<script setup>
  import InputText from "primevue/inputtext"
  import Checkbox from "primevue/checkbox"
  import Button from "primevue/button"
  import Divider from "primevue/divider"

  import { useRouter } from 'vue-router'
  const router = useRouter()

  import { useI18n } from 'vue-i18n'
  const { t } = useI18n()

  function handleSent({ parameters, result }) {
    const { authentication } = result
    router.push({
      name: 'user:sent',
      params: {
        authentication
      }
    })
  }

</script>

<style>

</style>
