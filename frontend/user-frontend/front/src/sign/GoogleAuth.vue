<template>
  <div class="w-full lg:w-6 md:w-9" v-shared-element:form="{ duration: '300ms', includeChildren: true }">
    <div class="surface-card p-4 shadow-2 border-round">

      <div class="text-center mb-5">
        <div class="text-900 text-3xl font-medium mb-3">Google authentication</div>
      </div>

      <div v-if="state === 'canceled'" class="text-center">
        <div>Authentication canceled by user</div>
        <div class="flex flex-row">
          <Button @click="back" label="Go back" icon="pi pi-arrow-left" class="w-full p-button-secondary mb-1" />
          <Button @click="googleAuth" label="Try again" icon="pi pi-google" class="w-full p-button-secondary mb-1" />
        </div>
      </div>
      <div v-else-if="state === 'waiting'" class="text-center">
        Authentication will open in a new window.
      </div>
      <div v-else-if="state === 'working'" class="text-center">
        Waiting for server...
      </div>
      <div v-else-if="state === 'error'" class="text-center">
        <div>Error during authentication</div>
        <div>{{ error }}</div>
      </div>
      <div v-else>
        Unknown authentication state: {{ state }}
      </div>

    </div>
  </div>
</template>

<script setup>
  import { loadGoogleAuth2 } from "../utils/googleApi.js"
  import { defineProps, toRefs, ref, onMounted, inject } from 'vue'

  import { useApi } from "@live-change/vue3-ssr"
  const api = useApi()

  import { useToast } from 'primevue/usetoast'
  const toast = useToast()

  const workingZone = inject('workingZone')

  import { useRouter } from 'vue-router'
  const router = useRouter()

  const props = defineProps({
    action: {
      type: String,
      default: 'signInOrSignUp'
    }
  })

  const { action } = toRefs(props)
  const state = ref('waiting')
  const error = ref(null)

  async function googleAuth() {
    state.value = 'waiting'
    const auth = await loadGoogleAuth2()
    const googleRedirectUri = document.location.protocol + '//' + document.location.host
      + router.resolve({ name: 'user:googleAuthReturn', params: { action: action.value } }).href
    const response = await (auth.signIn({
      scope: 'profile email'
    }).catch(error => {
      if(error.error === 'popup_blocked_by_browser') {
        return auth.signIn({
          scope: 'profile email',
          ux_mode: 'redirect',
          redirect_uri: googleRedirectUri
        })
      }
      if(error.error === 'popup_closed_by_user') {
        toast.add({ severity: 'warning', summary: 'Canceled', detail: 'You closed login window', life: 3000 })
        state.value = 'canceled'
        return
      }
      throw error
    }))

    state.value = 'working'
    try {
      const result = await workingZone.addPromise(`google ${action.value}`,
        api.command(['googleAuthentication', action.value], {
         accessToken: response.getAuthResponse().id_token
        })
      )
      //console.log("GAUTH RESULT", result)
      const { action: actionDone, user } = result
      while(api.client.value.user !== result.user) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      if(actionDone === 'signIn') {
        router.push({ name: 'user:signInFinished' })
      } else if(actionDone === 'signUp') {
        router.push({ name: 'user:signUpFinished' })
      } else {
        console.error("Unknown action", actionDone)
      }
    } catch(error) {
      console.error("Google auth error", error)
      toast.add({ severity: 'error', summary: 'Error', detail: 'Error during google authentication', life: 3000 })
      state.value = 'error'
      error.value = error
    }
  }

  async function back() {
    router.go(-1)
  }

  onMounted(() => {
    googleAuth()
  })

</script>

<style scoped>

</style>