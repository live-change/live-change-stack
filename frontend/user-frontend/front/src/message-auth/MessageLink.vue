<template>
  <div class="w-full lg:w-6/12 md:w-9/12 max-w-[32rem]" v-shared-element:form="{ duration: '300ms', includeChildren: true }">

    <div class="bg-surface-0 dark:bg-surface-900 rounded-border shadow p-6" v-if="isUnknown && !isRedirecting">
      <div class="text-surface-900 dark:text-surface-0 font-medium mb-4 text-xl">{{ t('auth.unknownLink') }}</div>
      <p class="mt-0 mb-2 p-0 leading-normal">
        {{ t('auth.unknownLinkDesc') }}
      </p>
    </div>

    <div class="bg-surface-0 dark:bg-surface-900 rounded-border shadow p-6" v-if="isUsed && !isRedirecting">
      <div class="text-surface-900 dark:text-surface-0 font-medium mb-4 text-xl">{{ t('auth.linkUsed') }}</div>
      <p class="mt-0 mb-2 p-0 leading-normal">
        {{ t('auth.linkUsedDesc') }}
      </p>
    </div>

    <div class="bg-surface-0 dark:bg-surface-900 rounded-border shadow p-6" v-if="isExpired && !isUsed && !isRedirecting">
      <div class="text-surface-900 dark:text-surface-0 font-medium mb-4 text-xl">{{ t('auth.linkExpired') }}</div>
      <p class="mt-0 mb-6 p-0 leading-normal">
        {{ t('messageAuth.linkExpiredDesc') }}
      </p>
      <Button :label="t('messageAuth.resend')" class="p-button-lg" @click="resend"></Button>
    </div>

    <div v-if="isReady || isRedirecting" 
         class="bg-surface-0 dark:bg-surface-900 rounded-border shadow p-6 flex justify-center">      
      <ProgressSpinner class="m-4" />
    </div>
  </div>
</template>

<script setup>
  import Button from "primevue/button"
  import ProgressSpinner from "primevue/progressspinner"

  import { computed, inject, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useNow } from '@vueuse/core'
  import { path, live, actions } from '@live-change/vue3-ssr'

  import { useI18n } from 'vue-i18n'
  const { t } = useI18n()

  const { secretCode } = defineProps({
    secretCode: {
      type: String,
      required: true
    }
  })

  const now = useNow({ interval: 1000 })

  const workingZone = inject('workingZone')
  const router = useRouter()

  const { finishMessageAuthentication, resendMessageAuthentication } = actions().messageAuthentication

  function resend() {
    workingZone.addPromise('resendMessageAuthentication', (async () => {
      const { authentication } = await resendMessageAuthentication({
        authentication: link?.value?.authenticationData?.id
      })
      router.push({
        name: 'user:sent',
        params: {
          authentication
        }
      })
    })())
  }

  const [ link ] = await Promise.all([
    live(
      path().secretLink.link({ secretCode })
          .with(link => path().messageAuthentication.authentication({
            authentication: link.authentication.$nonEmpty()
          }).bind('authenticationData')
      )
    )
  ])

  const authenticationState = computed(() => link?.value?.authenticationData?.state)

  const isUnknown = computed(() => link.value === null)
  const isExpired = computed(() => link.value ? (now.value.toISOString() > link.value.expire) : false )
  const isUsed = computed(() => authenticationState.value && authenticationState.value === 'used')
  const isReady = computed(() => !(isUnknown.value || isExpired.value || isUsed.value))  

  //const targetPage = computed(() => link.value?.authenticationData?.targetPage )

  const isRedirecting = ref(false)

  if(typeof window != 'undefined') setTimeout(() => { /// timeout "fixes" suspense bug
    console.log("LINK", link.value)
    if(isReady.value) {
      workingZone.addPromise('finishMessageAuthentication', (async () => {
        const { result, targetPage } = await finishMessageAuthentication({ secretType: 'link', secret: secretCode })
        router.push(targetPage)
      })())
      isRedirecting.value = true
      return
    }
    if(isUsed.value || isExpired.value) {
      console.log("LINK USED IS USED!", link)
      const fallbackPage = link.value?.authenticationData?.fallbackPage
      console.log("FB", fallbackPage)
      if(fallbackPage) {
        const error = isUsed.value ? 'used' : 'expired'
        router.push({ ...fallbackPage, params: { ...fallbackPage.params, error } })
        isRedirecting.value = true
      }
    }
  }, 10)

</script>

<style>

</style>
