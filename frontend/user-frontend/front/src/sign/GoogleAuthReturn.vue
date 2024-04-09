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
        </div>
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


  onMounted(async () => {
    const id_token = decodeURIComponent(
      document.location.hash
        .slice(1)
        .split('&')
        .map(p => p.split('='))
        .find(a => a[0] === 'id_token')
        [1]
    )
    if(!id_token) {
      state.value = 'canceled'
      return
    }
    try {
      const result = await workingZone.addPromise(`google ${action.value}`,
        api.command(['googleAuthentication', action.value], {
          accessToken: id_token
        })
      )
      console.log("GAUTH RESULT", result)
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
  })

  async function back() {
    router.go(-1)
  }

</script>

<style scoped>

</style>