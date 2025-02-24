<template>
  <view-root>
    <template #navbar>
      <NavBar />
      <UpdateBanner />
    </template>
  </view-root>
</template>

<script setup>
  import "@fortawesome/fontawesome-free/css/all.min.css"

  import { useLocale } from '@live-change/vue3-components'
  const locale = useLocale()
  if(typeof window !== 'undefined') locale.captureLocale()

  import { ViewRoot, NavBar, UpdateBanner } from "@live-change/frontend-base"

  import { computed } from 'vue'
  import { useHead } from '@vueuse/head'

  import { useI18n } from 'vue-i18n'
  const i18n = useI18n()

  import { client as useClient, useApi } from '@live-change/vue3-ssr'
  const api = useApi()
  const client = useClient()

  useHead(computed(() => ({
    title: api.metadata.config.value.brandName,
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport',
        content: "user-scalable=no, initial-scale=1, maximum-scale=1, minimum-scale=1," +
          " width=device-width, viewport-fit=cover" }
    ],
    htmlAttrs: {
      lang: i18n.locale.value,
      amp: true
    },
  })))

  import { watch } from 'vue'
  watch(client, (newClient, oldClient) => {
    console.log("WATCH CLIENT", oldClient, '=>', newClient)
  })

  import emailValidator from "@live-change/email-service/clientEmailValidator.js"
  import passwordValidator from "@live-change/password-authentication-service/clientPasswordValidator.js"
  api.validators.email = emailValidator
  api.validators.password = passwordValidator

  import { defaultHighlightStyle } from "@codemirror/language"
  import { StyleModule } from "style-mod"
  if(typeof window != 'undefined') {
    StyleModule.mount(window.document, defaultHighlightStyle.module)
  }

  import "./analytics"

</script>


<style>
  @import "tailwindcss";
  @plugin "tailwindcss-primeui";

  @custom-variant dark (&:where(.app-dark-mode, .app-dark-mode *));

  :root {
    --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
    font-family: var(--font-sans)
  }
  /* @supports (font-variation-settings: normal) {
    :root { font-family: 'Verdana var', sans-serif; }
  } */
  html,body
  {
    min-height: 100%;
    font-family: var(--font-sans);
    font-weight: 400;
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