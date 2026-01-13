<template>
  <div class="w-full lg:w-6/12 md:w-9/12 max-w-[32rem]" v-shared-element:form="{ duration: '300ms', includeChildren: true }">
    <div class="bg-surface-0 dark:bg-surface-900 p-6 shadow rounded-border">

      <div class="text-center mb-8">
        <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">Google authentication</div>
      </div>

      <div v-if="state === 'canceled'" class="text-center">
        <div>Authentication canceled by user</div>
        <div class="flex flex-row">
          <Button @click="back" label="Go back" icon="pi pi-arrow-left"
                  class="w-full p-button-secondary mb-1" />
        </div>
      </div>
      <div v-else-if="state === 'working'" class="text-center">
        Waiting for server...
      </div>
      <div v-else-if="state === 'error'" class="text-center">
        <div>Error during authentication</div>
        <div>{{ error }}</div>
      </div>
      <div v-else-if="state === 'emailTaken'" class="text-center">
        <div>
          Your account was created using email address. If you want to connect your Google account, 
          you need to sign in with this email address. And connect your Google account using 
          <router-link :to="{ name: 'user:connected' }">connected accounts page</router-link>.
        </div>
      </div>
      <div v-else>
        Unknown authentication state: {{ state }}
      </div>

    </div>
  </div>
</template>

<script setup>
  import { defineProps, toRefs, ref, onMounted, inject } from 'vue'

  import { useApi } from "@live-change/vue3-ssr"
  const api = useApi()

  import { useToast } from 'primevue/usetoast'
  const toast = useToast()

  const workingZone = inject('workingZone')

  import { useRouter, useRoute } from 'vue-router'
  const router = useRouter()
  const route = useRoute()

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
    const query = route.query
    console.log("QUERY", query)

    if(!query.code) {
      state.value = 'canceled'
      return
    }
    await workingZone.addPromise(`google ${action.value}`, (async () => {
      try {
        const result = await api.command(['googleAuthentication', action.value], {
          redirectUri: document.location.protocol + '//' + document.location.host
            + router.resolve({ name: 'user:googleAuthReturn', params: { action: action.value } }).href,
          ...query
        })
        console.log("GAUTH RESULT", result)
        const { action: actionDone, user } = result
        while(user && api.client.value.user !== user) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
        if(actionDone === 'signIn') {
          router.push({ name: 'user:signInFinished' })
        } else if(actionDone === 'signUp') {
          router.push({ name: 'user:signUpFinished' })
        } else if(actionDone === 'connectGoogle') {
          router.push({ name: 'user:connected' })
        } else if(actionDone === 'addOfflineAccessToken') {
          router.push({ name: 'user:google-access-gained' })
        } else {
          console.error("Unknown action", actionDone)
        }
      } catch(err) {
        if(err?.properties?.email == 'emailTaken') {
          toast.add({ severity: 'error', summary: 'Error', detail: 'Email is already in use', life: 3000 })
          state.value = 'emailTaken'
          return
        }
        console.error("Google auth error", err)
        toast.add({ severity: 'error', summary: 'Error', detail: 'Error during google authentication', life: 3000 })
        state.value = 'error' 
        error.value = err
      } 
    })())
  })

  async function back() {
    router.go(-1)
  }

</script>

<style scoped>

</style>