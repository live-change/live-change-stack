<template>
  <div class="w-full lg:w-6/12 md:w-9/12" v-shared-element:form="{ duration: '300ms', includeChildren: true }">

    <div class="bg-surface-0 dark:bg-surface-900 rounded-border shadow p-6" v-if="isUnknown">
      <div class="text-surface-900 dark:text-surface-0 font-medium mb-4 text-xl">Unknown link</div>
      <p class="mt-0 mb-2 p-0 leading-normal">We can't find your secret link. Check if you copied the address correctly.</p>
    </div>

    <div class="bg-surface-0 dark:bg-surface-900 rounded-border shadow p-6" v-if="isUsed">
      <div class="text-surface-900 dark:text-surface-0 font-medium mb-4 text-xl">Link used</div>
      <p class="mt-0 mb-2 p-0 leading-normal">This link was already used.</p>
    </div>

    <div class="bg-surface-0 dark:bg-surface-900 rounded-border shadow p-6" v-if="isExpired && !isUsed">
      <div class="text-surface-900 dark:text-surface-0 font-medium mb-4 text-xl">Link expired</div>
      <p class="mt-0 mb-6 p-0 leading-normal">Your secret link already expired. To send another link click button below.</p>
      <Button label="Resend" class="p-button-lg" @click="resend"></Button>
    </div>

    <div class="bg-surface-0 dark:bg-surface-900 rounded-border shadow p-6 flex justify-center" v-if="isReady">
      <ProgressSpinner class="m-4" />
    </div>
  </div>
</template>

<script setup>
  import Button from "primevue/button"
  import ProgressSpinner from "primevue/progressspinner"

  import { computed, inject } from 'vue'
  import { useRouter } from 'vue-router'
  import { useNow } from '@vueuse/core'
  import { path, live, actions } from '@live-change/vue3-ssr'

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

  if(typeof window != 'undefined') setTimeout(() => { /// timeout "fixes" suspense bug
    if(isReady.value) {
      workingZone.addPromise('finishMessageAuthentication', (async () => {
        const { result, targetPage } = await finishMessageAuthentication({ secretType: 'link', secret: secretCode })
        router.push(targetPage)
      })())
    }
    if(isUsed.value || isExpired.value) {
      const fallbackPage = link.value?.authenticationData?.fallbackPage
      console.log("FB", fallbackPage)
      if(fallbackPage) {
        const error = isUsed.value ? 'used' : 'expired'
        router.push({ ...fallbackPage, params: { ...fallbackPage.params, error } })
      }
    }
  }, 10)

</script>

<style>

</style>
