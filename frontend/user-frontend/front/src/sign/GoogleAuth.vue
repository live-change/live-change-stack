<template>
  <div class="w-full lg:w-6/12 md:w-9/12 max-w-[32rem]" v-shared-element:form="{ duration: '300ms', includeChildren: true }">
    <div class="bg-surface-0 dark:bg-surface-900 p-6 shadow rounded-border">

      <div class="text-center mb-8">
        <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">{{ t('googleAuth.title') }}</div>
      </div>

      <div v-if="state === 'canceled'" class="text-center">
        <div>{{ t('googleAuth.canceled') }}</div>
        <div class="flex flex-row">
          <Button @click="back" :label="t('auth.goBack')" icon="pi pi-arrow-left" class="w-full p-button-secondary mb-1" />
          <Button @click="googleAuth" :label="t('auth.tryAgain')" icon="pi pi-google" class="w-full p-button-secondary mb-1" />
        </div>
      </div>
      <div v-else-if="state === 'waiting'" class="text-center">
        {{ t('googleAuth.waitingForRedirect') }}
      </div>
      <div v-else-if="state === 'working'" class="text-center">
        {{ t('googleAuth.waiting') }}
      </div>
      <div v-else-if="state === 'error'" class="text-center">
        <div>{{ t('googleAuth.errorWithColon') }}</div>
        <div>{{ error }}</div>
      </div>
      <div v-else>
        {{ t('googleAuth.unknownState', { state }) }}
      </div>

    </div>
  </div>
</template>

<script setup>
  import { defineProps, toRefs, ref, onMounted, inject } from 'vue'

  import { useRouter } from 'vue-router'
  const router = useRouter()

  import { useI18n } from 'vue-i18n'
  const { t } = useI18n()

  const workingZone = inject('workingZone')

  import { googleAuthRedirect } from '../utils/googleAuth.js'

  const props = defineProps({
    action: {
      type: String,
      default: 'signInOrSignUp'
    },
    accessType: {
      type: String,
      default: 'online', //'offline'
    },
    scopes: {
      type: Array,
      default: () => ['profile', 'email']
    }
  })

  const { action, accessType, scopes } = toRefs(props)
  const state = ref('waiting')
  const error = ref(null)

  import { useApi } from '@live-change/vue3-ssr'
  const api = useApi()

  function googleAuth() {
    state.value = 'waiting'

    localStorage.googleAuthScopes = JSON.stringify(scopes.value)

    workingZone.addPromise('google auth', new Promise((resolve, reject) => {
      setTimeout(() => {
        state.value = 'error'
        error.value = 'redirect_timeout'
        // return reject('redirect timeout?!')
        return resolve()
      }, 4000)
    }))

    let allScopes = new Set(scopes.value ?? [])
    allScopes.add('profile') // it will be needed if account is not connected
    allScopes.add('email') // it will be needed if account is not connected

    googleAuthRedirect({
      scope: Array.from(allScopes).join(' '),
      redirectUri: document.location.protocol + '//' + document.location.host
        + router.resolve({ name: 'user:googleAuthReturn', params: { action: action.value } }).href,
      accessType: accessType.value,
      clientId: api.services.googleAuthentication.config.clientId
    })

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