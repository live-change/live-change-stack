<template>
  <div class="w-full lg:w-6/12 md:w-9/12 max-w-[32rem]" v-shared-element:form="{ duration: '300ms', includeChildren: true }">
    <div class="bg-surface-0 dark:bg-surface-900 rounded-border shadow p-6">
      <div class="text-surface-900 dark:text-surface-0 font-medium mb-4 text-xl mb-6">{{ t('googleAccess.gainedTitle') }}</div>
      <p class="mt-0 p-0 leading-normal">
        {{ t('googleAccess.gainedMessage') }}
        <ul>
          <li v-for="access in accessList">
            {{ access }}
          </li>
        </ul>
<!--        <pre>{{ offlineAccess }}</pre>-->
      </p>
      <div v-if="afterGoogleAccessGained" class="flex flex-row items-center">
        <router-link :to="afterGoogleAccessGained" class="no-underline">
          <Button :label="t('googleAccess.next')" v-ripple />
        </router-link>
        <p class="ml-6" v-if="isMounted && redirectTime">
          {{ t('googleAccess.redirectIn', { seconds: pluralize('second', Math.ceil((redirectTime - currentTime) / 1000), true) }) }}
        </p>
      </div>
      <div v-else>
        <i18n-t keypath="googleAccess.returnToIndex" tag="span">
          <template #link>
            <router-link to="/">{{ t('googleAccess.indexPage') }}</router-link>
          </template>
        </i18n-t>
      </div>
    </div>
  </div>
</template>

<script setup>

  import Button from 'primevue/button'

  import { useI18n } from 'vue-i18n'
  const { t } = useI18n()

  import { onMounted, ref } from 'vue'
  const isMounted = ref(false)
  onMounted(() => isMounted.value = true)

  import { computed } from 'vue'
  import { currentTime } from "@live-change/frontend-base"

  import { useRouter } from 'vue-router'
  const router = useRouter()

  import { usePath, live, useApi } from "@live-change/vue3-ssr"
  const api = useApi()

  import { useToast } from 'primevue/usetoast'
  const toast = useToast()

  const userClientConfig = api.getServiceDefinition('user')?.clientConfig

  import pluralize from 'pluralize'

  const afterGoogleAccessGained = ref()
  const redirectTime = ref()
  let redirectTimeout
  function doRedirect() {
    if(localStorage.afterGoogleAccessGained) {
      const route = JSON.parse(localStorage.afterGoogleAccessGained)
      localStorage.removeItem('afterGoogleAccessGained')
      const delay = route?.meta?.afterGoogleAccessGainedRedirectDelay
                 ?? userClientConfig?.afterGoogleAccessGainedRedirectDelay 
                 ?? 10
      delete route.meta
      afterGoogleAccessGained.value = route
      if(delay) {
        redirectTime.value = new Date(Date.now() + delay * 1000).getTime()
        redirectTimeout = setTimeout(() => {
          if(!finished) router.push(route)
        }, redirectTime.value - currentTime.value)
      } else {
        setTimeout(() => { // it could be next tick
          toast.add({
            severity: 'info', life: 6000,
            summary: t('googleAccess.signedInToast'),
            detail: t('googleAccess.signedInToastDetail')
          })
          router.push(route)
        }, 100)
      }
    }
  }
  let finished = false
  
  onMounted(() => {
    if(!finished) doRedirect()
  })

  const path = usePath()
  const [ offlineAccess ] = await Promise.all([
    live(path.googleAuthentication.myUserOfflineAccess({}))
  ])

  const accessList = computed(() => offlineAccess.value.scopes.map(
    scope => scope.split('/').pop()
  ))
</script>

<style>

</style>
