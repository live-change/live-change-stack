<template>
  <view-root>
    <template #navbar>
      <NavBar />
    </template>
  </view-root>
</template>

<script setup>

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

<style>
  @import "tailwindcss";
  @plugin "tailwindcss-primeui";

  @custom-variant dark (&:where(.app-dark-mode, .app-dark-mode *));

  :root { font-family: 'Verdana', sans-serif; }
  @supports (font-variation-settings: normal) {
    :root { font-family: 'Verdana var', sans-serif; }
  }
  html,body
  {
    min-height:100%;
    font-family: 'Verdana var', 'Verdana', sans-serif;
  }

  @layer base {
    a {
      color: var(--p-blue-700);
      text-decoration: underline;
    }
    a:hover {
      color: var(--p-blue-900);
      text-decoration: none;
    }
    a:visited {
      color: var(--p-purple-800);
    }
  }

</style>