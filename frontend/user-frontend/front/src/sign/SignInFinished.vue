<template>
  <div class="w-full lg:w-6 md:w-9" v-shared-element:form="{ duration: '300ms', includeChildren: true }">
    <div class="surface-card border-round shadow-2 p-4">
      <div class="text-900 font-medium mb-3 text-xl mb-4">Signed In</div>
      <p class="mt-0 p-0 line-height-3">Congratulations! You have successfully logged in to your account.</p>
      <div v-if="afterSignIn" class="flex flex-row justify-content-center align-items-center">
        <router-link :to="afterSignIn" class="no-underline">
          <Button label="Next" v-ripple />
        </router-link>
        <p class="ml-4" v-if="isMounted && redirectTime">
          Redirect in {{ pluralize('second', Math.ceil((redirectTime - currentTime) / 1000), true) }}...
        </p>
      </div>
      <div v-else>
        Return to <router-link to="/">index page</router-link>.
      </div>
    </div>
  </div>
</template>

<script setup>

  import Button from 'primevue/button'

  import { onMounted, ref } from 'vue'
  const isMounted = ref(false)
  onMounted(() => isMounted.value = true)

  import { computed, onUnmounted } from 'vue'
  import { currentTime } from "@live-change/frontend-base"

  import { useRouter } from 'vue-router'
  const router = useRouter()

  import pluralize from 'pluralize'

  import { useApi } from "@live-change/vue3-ssr"
  const api = useApi()

  import { useToast } from 'primevue/usetoast'
  const toast = useToast()
  import { useConfirm } from 'primevue/useconfirm'
  const confirm = useConfirm()

  const userClientConfig = api.getServiceDefinition('user')?.clientConfig

  const afterSignIn = ref()
  const redirectTime = ref()
  let redirectTimeout
  function doRedirect() {
    if(localStorage.redirectAfterSignIn) {
      const route = JSON.parse(localStorage.redirectAfterSignIn)
      localStorage.removeItem('redirectAfterSignIn')
      const delay = route?.meta?.afterSignInRedirectDelay ?? userClientConfig?.afterSignInRedirectDelay ?? 10
      delete route.meta
      afterSignIn.value = route
      if(delay) {
        redirectTime.value = new Date(Date.now() + delay * 1000)
        redirectTimeout = setTimeout(() => {
          if(!finished) router.push(route)
        }, redirectTime.value - currentTime.value)
      } else {
        setTimeout(() => { // it could be next tick
          toast.add({
            severity: 'info', life: 6000,
            summary: 'Signed in',
            detail: 'Congratulations! You have successfully logged in to your account.'
          })
          router.push(route)
        }, 100)
      }
    }
  }
  let finished = false
  onMounted(async () => {
    console.log("WAIT FOR USER?", !finished, !api.client.value.user, !finished && !api.client.value.user)
    while(!finished && !api.client.value.user) {
      console.log("WAITING FOR USER...")
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    if(!finished) doRedirect()
  })
  onUnmounted(() => {
    finished = true
    if(redirectTime.value) clearTimeout(redirectTimeout)
  })

</script>

<style>

</style>
