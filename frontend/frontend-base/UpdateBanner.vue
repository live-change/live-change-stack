<template>
  <div v-if="updateAvailable && !updateBannerHidden" class="bg-yellow-400 text-gray-900 p-3 flex
        justify-between lg:justify-center items-center flex-wrap">
    <div class="font-bold mr-20">{{ t('app.updateAvailable') }}</div>
    <div class="items-center hidden md:flex">
      <span class="leading-normal">{{ t("app.newVersions") }}</span>
    </div>
    <div class="flex items-center ml-2 mr-20">
      <a class="text-gray-900" href="#" @click="update">
        <span class="underline font-bold hover:no-underline">{{ t("app.reload") }}</span>
      </a>
    </div>
    <a v-ripple class="flex items-center no-underline justify-center border-circle text-gray-900
         hover:bg-yellow-300 cursor-pointer transition-colors transition-duration-150 p-ripple"
       style="width:2rem; height: 2rem" @click="hideUpdateBanner">
      <i class="pi pi-times"></i>
    </a>
  </div>
</template>

<script setup>

  import { computed, ref } from 'vue'

  import { useApi } from '@live-change/vue3-ssr'
  const api = useApi()

  import { useI18n } from 'vue-i18n'
  const { t } = useI18n()

  const updateAvailable = computed(() => api.metadata.versionMismatch.value)
  const updateBannerHidden = ref(false)
  function hideUpdateBanner() {
    updateBannerHidden.value = true
  }

  async function update(ev) {
    ev.preventDefault()
    ev.stopPropagation()
    if (ENV_MODE === 'pwa' && navigator.serviceWorker) {
      if(navigator.serviceWorker.ready) {
        console.log("TRY UPDATE PWA!")
        setTimeout(() => {
          console.log("RELOADING ON TIMEOUT!!")
          document.location.reload(true)
        }, 2000)
        try {
          const registration = await navigator.serviceWorker.ready
          await registration.unregister()
          //await registration.update()
        } catch(e) {
          console.error("PWA UPDATE ERROR", e)
        }
      }
    }
    document.location.reload()
  }

</script>

<style scoped>

</style>