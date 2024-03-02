<template>
  <div class="w-full lg:w-6 md:w-9" v-shared-element:form="{ duration: '300ms', includeChildren: true }">

    <div class="surface-card border-round shadow-2 p-4" v-if="isUnknown">
      <div class="text-900 font-medium mb-3 text-xl">Unknown link</div>
      <p class="mt-0 mb-2 p-0 line-height-3">We can't find your secret link. Check if you copied the address correctly.</p>
    </div>

    <div class="surface-card border-round shadow-2 p-4" v-if="isUsed">
      <div class="text-900 font-medium mb-3 text-xl">Link used</div>
      <p class="mt-0 mb-2 p-0 line-height-3">This link was already used.</p>
    </div>

    <div class="surface-card border-round shadow-2 p-4" v-if="isExpired && !isUsed">
      <div class="text-900 font-medium mb-3 text-xl">Link expired</div>
      <p class="mt-0 mb-4 p-0 line-height-3">Your secret link already expired. To send another link click button below.</p>
      <Button label="Resend" class="p-button-lg" @click="resend"></Button>
    </div>

    <div class="surface-card border-round shadow-2 p-4 flex justify-content-center" v-if="isReady">
      <ProgressSpinner class="m-3" />
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

  const authenticationState = computed(() => link?.value?.authenticationData?.state )

  const isUnknown = computed(() => link.value === null)
  const isExpired = computed(() => link.value ? (now.value.toISOString() > link.value.expire) : false )
  const isUsed = computed(() => authenticationState.value && authenticationState.value == 'used')
  const isReady = computed(() => !(isUnknown.value || isExpired.value || isUsed.value))

  //const targetPage = computed(() => link.value?.authentication?.targetPage )

  if(typeof window != 'undefined') setTimeout(() => { /// timeout "fixes" suspense bug
    if(isReady.value) {
      workingZone.addPromise('finishMessageAuthentication', (async () => {
        const { result, targetPage } = await finishMessageAuthentication({ secretType: 'link', secret: secretCode })
        router.push(targetPage)
      })())
    }
  }, 10)

</script>

<style>

</style>
