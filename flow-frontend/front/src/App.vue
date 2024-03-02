<template>
  <view-root>
    <template #navbar>
      <NavBar />
    </template>
  </view-root>
</template>

<script setup>
  import 'primevue/resources/themes/saga-green/theme.css'
  import "@fortawesome/fontawesome-free/css/all.min.css"

  import { ViewRoot, NavBar } from "@live-change/frontend-base"

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

</script>
