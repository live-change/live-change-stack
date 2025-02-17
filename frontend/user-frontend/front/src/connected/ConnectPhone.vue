<template>
  <div class="w-full lg:w-6/12 md:w-9/12" v-shared-element:form="{ duration: '300ms', includeChildren: true }">
    <div class="bg-surface-0 dark:bg-surface-900 p-6 shadow rounded-border">
      <div class="text-center mb-8">
        <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">Add phone number</div>
      </div>

      <command-form service="messageAuthentication" action="connectPhone" v-slot="{ data }"
                    @done="handleSent" keepOnDone>

        <div class="p-field mb-4">
          <label for="email" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">
            Phone number
          </label>
          <PhoneInput id="phone" class="w-full"
                     aria-describedby="phone-help" :class="{ 'p-invalid': data.phoneError }"
                     v-model="data.phone" />
          <Message v-if="data.phoneError" severity="error" variant="simple" size="small">
            {{ t(`errors.${data.phoneError}`) }}
          </Message>
        </div>

        <Button label="Add Phone" icon="pi pi-mobile" class="w-full" type="submit" />

        <Divider align="center" class="my-6">
          <span class="text-surface-600 dark:text-surface-200 font-normal text-sm">OR</span>
        </Divider>

        <router-link :to="{ name: 'user:connect-email' }">
          <Button label="Add Email" icon="pi pi-envelope" class="w-full p-button-secondary mb-2" />
        </router-link>

<!--        <Button label="Connect GitHub account" icon="pi pi-github" class="w-full p-button-secondary mb-2"></Button>-->
<!--        <Button label="Connect Google account" icon="pi pi-google" class="w-full p-button-secondary mb-1"></Button>-->

      </command-form>
    </div>
  </div>
</template>

<script setup>
  import InputText from "primevue/inputtext"
  import Checkbox from "primevue/checkbox"
  import Button from "primevue/button"
  import Divider from "primevue/divider"
  import Message from "primevue/message"
  
  import PhoneInput from "../phone/PhoneInput.vue"

  import { useI18n } from 'vue-i18n'
  const { t } = useI18n()

  import { useRouter } from 'vue-router'
  const router = useRouter()

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
