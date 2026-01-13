<template>
  <div class="w-full lg:w-6/12 md:w-9/12 max-w-[32rem]" v-shared-element:form="{ duration: '300ms', includeChildren: true }">
    <div class="bg-surface-0 dark:bg-surface-900 p-6 shadow rounded-border">

      <div class="text-center mb-8">
        <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">{{ t('linkedinAuth.title') }}</div>
      </div>

      <div v-if="state === 'canceled'" class="text-center">
        <div class="mb-2 text-red-500">{{ t('linkedinAuth.canceled') }}</div>
        <div class="flex flex-row">
          <Button @click="back" :label="t('auth.goBack')" icon="pi pi-arrow-left"
                  class="w-full p-button-secondary mb-1" />
        </div>
      </div>
      <div v-else-if="state === 'working'" class="text-center">
        {{ t('linkedinAuth.waiting') }}
      </div>
      <div v-else-if="state === 'error'" class="text-center">
        <div>{{ t('linkedinAuth.error') }}</div>
        <div>{{ error }}</div>
      </div>
      <div v-else>
        {{ t('linkedinAuth.unknownState', { state }) }}
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
    try {
      const result = await workingZone.addPromise(`linkedin ${action.value}`,
        api.command(['linkedinAuthentication', action.value], {
          redirectUri: document.location.protocol + '//' + document.location.host
            + router.resolve({ name: 'user:linkedinAuthReturn', params: { action: action.value } }).href,
          ...query
        })
      )
      console.log("LINKEDIN AUTH RESULT", result)
      const { action: actionDone, user } = result
      while(user && api.client.value.user !== user) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      if(actionDone === 'signIn') {
        router.push({ name: 'user:signInFinished' })
      } else if(actionDone === 'signUp') {
        router.push({ name: 'user:signUpFinished' })
      } else if(actionDone === 'connectLinkedin') {
        router.push({ name: 'user:connected' })
      } else if(actionDone === 'addOfflineAccessToken') {
        router.push({ name: 'user:linkedin-access-gained' })
      } else {
        console.error("Unknown action", actionDone)
      }
    } catch(error) {
      console.error("Linkedin auth error", error)
      toast.add({ severity: 'error', summary: t('common.error'), detail: t('linkedinAuth.errorToast'), life: 3000 })
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