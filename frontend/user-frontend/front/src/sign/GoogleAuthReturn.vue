<template>
  <div class="w-full lg:w-6/12 md:w-9/12 max-w-[32rem]" v-shared-element:form="{ duration: '300ms', includeChildren: true }">
    <div class="bg-surface-0 dark:bg-surface-900 p-6 shadow rounded-border">

      <div class="text-center mb-8">
        <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">{{ t('googleAuth.title') }}</div>
      </div>

      <div v-if="state === 'canceled'" class="text-center">
        <div>{{ t('googleAuth.canceled') }}</div>
        <div class="flex flex-row">
          <Button @click="back" :label="t('auth.goBack')" icon="pi pi-arrow-left"
                  class="w-full p-button-secondary mb-1" />
        </div>
      </div>
      <div v-else-if="state === 'working'" class="text-center">
        {{ t('googleAuth.waiting') }}
      </div>
      <div v-else-if="state === 'error'" class="text-center">
        <div>{{ t('googleAuth.error') }}</div>
        <div>{{ error }}</div>
      </div>
      <div v-else-if="state === 'emailTaken'" class="text-center">
        <div>
          <i18n-t keypath="googleAuth.emailTaken" tag="span">
            <template #link>
              <router-link :to="{ name: 'user:connected' }">{{ t('googleAuth.emailTakenLink') }}</router-link>
            </template>
          </i18n-t>
        </div>
      </div>
      <div v-else-if="state === 'invalidGrant'" class="text-center">
        <div>
          {{ t('googleAuth.invalidGrant') }}
          <div class="flex flex-row">
            <Button @click="back" :label="t('auth.goBack')" icon="pi pi-arrow-left" class="w-full p-button-secondary mb-1" />
            <Button @click="googleAuth" :label="t('auth.tryAgain')" icon="pi pi-google" class="w-full p-button-secondary mb-1" />
          </div>
        </div>
      </div>
      <div v-else-if="state === 'connectedToAnotherUser'" class="text-center">
        <div>
          {{ t('googleAuth.connectedToAnotherUser') }}
        </div>
      </div>
      <div v-else-if="state === 'alreadyConnected'" class="text-center">
        <div>
          {{ t('googleAuth.alreadyConnected') }}
          <div class="flex flex-row mt-4 justify-center">
            <router-link :to="{ name: 'user:connected' }">
              <Button :label="t('auth.goToConnected')" icon="pi pi-arrow-left" class="w-full p-button-secondary mb-1" />
            </router-link>
          </div>
        </div>
      </div>
      <div v-else>
        {{ t('googleAuth.unknownState', { state }) }}
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

  import { useI18n } from 'vue-i18n'
  const { t } = useI18n()

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
        localStorage.removeItem('googleAuthScopes')
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
          toast.add({ severity: 'error', summary: t('common.error'), detail: t('googleAuth.emailAlreadyInUse'), life: 3000 })
          state.value = 'emailTaken'
          return
        }
        if((typeof err == 'string') && err.startsWith('invalid_grant')) {
          toast.add({ severity: 'error', summary: t('common.error'), detail: t('googleAuth.invalidGrantToast'), life: 3000 })
          state.value = 'invalidGrant'
          return
        }
        if(err === 'connectedToAnotherUser' || err === 'alreadyConnectedElsewhere') {
          toast.add({ severity: 'error', summary: t('common.error'), detail: t('googleAuth.connectedToAnotherUserToast'), life: 3000 })
          state.value = 'connectedToAnotherUser'
          return
        }
        if(err === 'alreadyConnected') {
          toast.add({ severity: 'error', summary: t('common.error'), detail: t('googleAuth.alreadyConnectedToast'), life: 3000 })
          state.value = 'alreadyConnected'
          return
        }
        console.error("Google auth error", err)
        toast.add({ severity: 'error', summary: t('common.error'), detail: t('googleAuth.errorToast'), life: 3000 })
        state.value = 'error' 
        error.value = err
      } 
    })())
  })

  async function back() {
    router.go(-1)
  }

  async function googleAuth() {
    if(localStorage.googleAuthScopes) {
      const scopes = JSON.parse(localStorage.googleAuthScopes)
      router.push({ name: 'user:googleAuthScopes', params: { action: action.value, accessType: 'offline', scopes: scopes } })
    } else {
      router.push({ name: 'user:googleAuth', params: { action: action.value } })
    }
  }

</script>

<style scoped>

</style>