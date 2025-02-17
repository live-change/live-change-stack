<template>
  <div class="bg-surface-0 dark:bg-surface-950 px-6 py-20 md:px-12 lg:px-20">
    <div class="text-center code404">
      <span class="bg-white text-pink-500 font-bold text-2xl inline-block px-4">404</span>
    </div>
    <div class="mt-12 mb-8 font-bold text-6xl text-surface-900 dark:text-surface-0 text-center">Page Not Found</div>
    <p class="text-surface-700 dark:text-surface-100 text-3xl mt-0 mb-12 text-center">Sorry, we couldn't find the page.</p>
    <div class="text-center">
      <Button v-if="canGoBack" @click="goBack()"
              class="p-button-text mr-2" label="Go Back" icon="pi pi-arrow-left" />
      <router-link to="/" replace class="no-underline">
        <Button label="Go to Home" icon="pi pi-home" />
      </router-link>
    </div>
  </div>
</template>

<script setup>

  import Button from "primevue/button"

  import { computed, ref, onMounted } from 'vue'

  const isMounted = ref(false)
  onMounted(() => isMounted.value = true)

  const canGoBack = computed(() => {
    return isMounted.value && history.length > 1
  })

  import { useRouter } from 'vue-router'
  const router = useRouter()
  function goBack() {
    router.back()
  }

  import { useResponse } from "@live-change/frontend-base"
  useResponse({ status: 404 })
</script>

<style scoped>
  .code404 {
    background: radial-gradient(50% 109137.91% at 50% 50%, rgba(233, 30, 99, 0.1) 0%, rgba(254, 244, 247, 0) 100%);
  }
</style>
