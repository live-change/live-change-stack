<template>
  <view-root>
    <template #navbar>
      <NavBar />
    </template>
  </view-root>
</template>

<script setup>
  import 'primevue/resources/themes/lara-light-blue/theme.css'

  import { useLocale } from '@live-change/vue3-components'
  const locale = useLocale()
  locale.captureLocale()

  import NavBar from "./NavBar.vue"
  import ViewRoot from "@live-change/frontend-base/ViewRoot.vue"

  import { computed } from 'vue'
  import { useHead } from '@vueuse/head'
  useHead(computed(() => ({
    title: 'Title',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport',
        content: "user-scalable=no, initial-scale=1, maximum-scale=1, minimum-scale=1," +
          " width=device-width, viewport-fit=cover" }
    ],
    htmlAttrs: {
      lang: 'en',
      amp: true
    }
  })))

  import { watch } from 'vue'
  import { client as useClient, useApi } from '@live-change/vue3-ssr'
  const client = useClient()
  watch(client, (newClient, oldClient) => {
    console.log("WATCH CLIENT", oldClient, '=>', newClient)
  })

  const api = useApi()
  import emailValidator from "@live-change/email-service/clientEmailValidator.js"
  import phoneValidator from "@live-change/phone-service/clientPhoneValidator.js"
  import passwordValidator from "@live-change/password-authentication-service/clientPasswordValidator.js"
  api.validators.email = emailValidator
  api.validators.phone = phoneValidator
  api.validators.password = passwordValidator

</script>
