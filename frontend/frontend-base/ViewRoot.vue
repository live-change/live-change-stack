<template>
  <Toast v-if="isMounted" />
  <router-view v-slot="{ route, Component }">
    <template v-if="route?.meta?.raw">
      <suspense>
        <component :is="Component" />
      </suspense>
    </template>
    <loading-zone v-else suspense @isLoading="l => loading = l" :key="route.href">
      <template v-slot:loading>
        <div class="fixed w-full h-full flex align-items-center justify-content-center top-0 left-0">
          <ProgressSpinner animationDuration=".5s"/>
        </div>
      </template>
      <template v-slot:default="{ isLoading }">
        <page :loading="loading" :working="working" :route="route" :pageType="route?.meta?.pageType">
          <template #navbar>
            <slot name="navbar">&nbsp;</slot>
          </template>
          <working-zone @isWorking="w => working = w">
            <template v-slot:working>
              <div class="fixed w-full h-full flex align-items-center justify-content-center top-0 left-0">
                <ProgressSpinner animationDuration=".5s"/>
              </div>
            </template>
            <template v-slot:default="{ isWorking }">
              <component :is="Component" :style="isWorking || isLoading ? 'filter: blur(4px)' : ''"
                         class="working-blur" />
            </template>
          </working-zone>
          <template #footer>
            <slot name="footer"><div></div></slot>
          </template>
        </page>
      </template>
    </loading-zone>
  </router-view>
</template>

<script setup>

  import Toast from 'primevue/toast'

  import 'primevue/resources/primevue.min.css'
  import 'primeflex/primeflex.css'
  import 'primeicons/primeicons.css'

  import ProgressSpinner from 'primevue/progressspinner'

  import { useHead } from '@vueuse/head'
  import Page from "./Page.vue"

  const { meta } = useHead({
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport',
        content: "user-scalable=no, initial-scale=1, maximum-scale=1, minimum-scale=1," +
            " width=device-width, viewport-fit=cover" }
    ]
  })

  import { computed, onMounted, ref } from 'vue'

  const isMounted = ref(false)
  onMounted(() => isMounted.value = true)

  const working = ref(false)
  const loading = ref(false)

</script>

<style>

  body {
    margin: 0;
    height: 100%;
    overflow-x: hidden;
    overflow-y: auto;
    background-color: var(--surface-b);
    font-family: var(--font-family);
    font-weight: 400;
    color: var(--text-color);
  }
  .working-blur {
    transition: filter 0.3s;
  }

</style>
