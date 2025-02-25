<template>
  <ConfirmPopup v-if="isClientSide"></ConfirmPopup>
  <Toast v-if="isClientSide"></Toast>
  <router-view v-slot="{ route, Component }">
    <template v-if="route?.meta?.raw">
      <component :is="Component" />
    </template>
    <loading-zone v-else suspense @isLoading="l => loading = l">
      <template v-slot:loading>
        <div class="fixed w-full h-full flex items-center justify-center top-0 left-0">
          <ProgressSpinner animationDuration=".5s"/>
        </div>
      </template>
      <template v-slot:default="{ isLoading }">
        <page :loading="loading" :working="working">
          <working-zone @isWorking="w => working = w">
            <template v-slot:working>
              <div class="fixed w-full h-full flex items-center justify-center top-0 left-0">
                <ProgressSpinner animationDuration=".5s"/>
              </div>
            </template>
            <template v-slot:default="{ isWorking }">
              <component :is="Component"
                         :style="isWorking || isLoading ? 'filter: blur(4px)' : ''"
                         class="working-blur" />
            </template>
          </working-zone>
        </page>
      </template>
    </loading-zone>
  </router-view>
</template>

<script setup>
  import ConfirmPopup from 'primevue/confirmpopup'
  import Toast from 'primevue/toast'

  import "@fortawesome/fontawesome-free/css/all.min.css"
  import 'primeicons/primeicons.css'

  import ProgressSpinner from 'primevue/progressspinner'

  import Page from "./Page.vue"

  import { computed } from 'vue'
  import { useHead } from '@vueuse/head'
  useHead(computed(() => ({
    title: 'DB Admin',
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

  import { onMounted } from 'vue'
  import isClientSide from "./isClientSide.js"
  onMounted(() => isClientSide.value = true)

  import { ref } from 'vue'
  const working = ref(false)
  const loading = ref(false)

  import { watch } from 'vue'
  import { client as useClient } from '@live-change/vue3-ssr'
  const client = useClient()
  watch(client, (newClient, oldClient) => {
    console.log("WATCH CLIENT", oldClient, '=>', newClient)
  })

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

    
    h1, h2, h3, h4, h5, h6 {
      page-break-after: avoid;
      text-align: left;
    }

    h1 {
      font-size: 2.0em;
      margin-top: 1em;
      margin-bottom: 0.5em;
      font-weight: 500;
      color: var(--p-surface-700);
    }

    h2 {
      font-size: 1.75em;
      margin-top: 1em;
      margin-bottom: 0.5em;
      color: var(--p-surface-700);
      font-weight: 500;
    }

    h3 {
      font-size: 1.5em;
      margin-top: 1em;
      margin-bottom: 0.5em;
      color: var(--p-surface-800);
      font-weight: 500;
    }

    h4 {
      font-size: 1.23em;
      margin-top: 1em;
      margin-bottom: 0.5em;
      font-weight: 500;
      color: var(--p-surface-800);
    }

    p {
      margin-top: 0.5em;
      margin-bottom: 0.5em;
    }

    pre {
      font-family: monospace;
    }

    ul {
      list-style: disc;
    }
    ol {
      list-style: decimal;
    }
    li {
      margin-top: 0.23em;
      margin-bottom: 0.23em;    
    }
  }

  .working-blur {
    transition: filter 0.3s;
  }
</style>
