<template>
  <div class="w-full lg:w-6 md:w-9" v-shared-element:form="{ duration: '300ms', includeChildren: true }">
    <div class="surface-card p-4 shadow-2 border-round">
      <div class="text-center mb-5">
        <div class="text-900 text-3xl font-medium mb-3">Add email</div>
      </div>

      <command-form service="messageAuthentication" action="connectEmail" v-slot="{ data }"
                    @done="handleSent" keepOnDone>

        <div class="p-field mb-3">
          <label for="email" class="block text-900 font-medium mb-2">
            Email address
          </label>
          <InputText id="email" type="text" class="w-full"
                     aria-describedby="email-help" :class="{ 'p-invalid': data.emailError}"
                     v-model="data.email" />
          <small v-if="data.emailError" id="email-help" class="p-error">{{ t(`errors.${data.emailError}`) }}</small>
        </div>

        <Button label="Add Email" icon="pi pi-envelope" class="w-full" type="submit" />

        <Divider align="center" class="my-4">
          <span class="text-600 font-normal text-sm">OR</span>
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
