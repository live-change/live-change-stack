<template>
  <div class="w-full lg:w-6/12 md:w-9/12 max-w-[32rem]" v-shared-element:form="{ duration: '300ms', includeChildren: true }">
    <div class="bg-surface-0 dark:bg-surface-900 rounded-border shadow p-6" 
         v-if="authenticationData?.state === 'used' && !submitted">
      <div class="text-surface-900 dark:text-surface-0 font-medium mb-4 text-xl">{{ t('messageAuth.authenticationDone') }}</div>
      <p class="mt-0 mb-1 p-0 leading-normal">{{ t('messageAuth.authenticatedInDifferentTab') }}</p>
    </div>
    <div class="bg-surface-0 dark:bg-surface-900 rounded-border shadow p-6" v-else>
      <div class="text-surface-900 dark:text-surface-0 font-medium mb-4 text-xl">{{ localizedTitle }}</div>
      <p class="mt-0 mb-1 p-0 leading-normal">{{ localizedDescription }}</p>
      <p class="mt-0 mb-6 p-0 leading-normal">{{ localizedCallToAction }}</p>
      <Secured :events="['wrong-secret-code']" :actions="['checkSecretCode']">
        <command-form service="messageAuthentication" action="finishMessageAuthentication"
                      :parameters="{ secretType: 'code', authentication }" :key="authentication"
                      ref="form"
                      @submit="handleSubmit" @done="handleAuthenticated" @error="handleError"
                      v-slot="{ data }">
          <div class="flex justify-center flex-col items-center">
            <div class="p-field mx-1 flex flex-col items-center mb-4">
              <label for="code" class="sr-only">{{ t('messageAuth.code') }}</label>
              <!-- <InputOtp id="code"  :length="6" class="mb-2"
                         v-model="data.secret"
                         aria-describedby="code-help" :invalid="!!data.secretError" /> -->
              <InputMask id="code" class="p-inputtext-lg w-[7rem] text-center" mask="999999" slotChar="######" :placeholder="t('messageAuth.code')"
                         v-model="data.secret"
                         aria-describedby="code-help" :invalid="!!data.secretError" />
              <Message v-if="data.secretError" severity="error" variant="simple">
                {{ t(`errors.${data.secretError}`) }}
              </Message>
            </div>
            <div class="flex flex-col">
              <Button :label="t('common.ok')" type="submit" class="p-button-lg grow-0"
                      :disableda="data.secret?.length < 6" />
            </div>
          </div>
          <div v-if="data.secretError === 'codeExpired'" class="mt-4 text-center">
            <p class="mt-0 mb-2 p-0 leading-normal">{{ t('messageAuth.toSendAnotherCode') }}</p>
            <Button :label="t('messageAuth.resendSecretCode')" class="p-button-lg" @click="resend" />
          </div>
        </command-form>
      </Secured>
    </div>
  </div>
</template>

<script setup>
  import InputMask from "primevue/inputmask"
  import Button from "primevue/button"
  import Message from "primevue/message"

  import { Secured } from "@live-change/security-frontend"

  import { useRouter } from 'vue-router'
  const router = useRouter()
  import { ref, computed } from 'vue'

  import { useToast } from 'primevue/usetoast'
  const toast = useToast()

  import { useI18n } from 'vue-i18n'
  const { t } = useI18n()

  const props = defineProps({
    authentication: {
      type: String,
      required: true
    },
    title: {
      type: String,
      default: null,      
    },
    description: {
      type: String,
      default: null,
    },
    callToAction: {
      type: String,
      default: null,
    },
  })

  const { authentication } = props

  // Computed properties for localized texts
  const localizedTitle = computed(() => props.title || t('messageAuth.messageSent'))
  const localizedDescription = computed(() => props.description || t('messageAuth.messageSentDescription'))
  const localizedCallToAction = computed(() => props.callToAction || t('messageAuth.callToAction'))

  function handleAuthenticated({ parameters, result }) {
    const { targetPage } = result
    console.log("TARGET ROUTE", targetPage)
    router.push(targetPage)
  }

  const submitted = ref(false)

  function handleSubmit() {
    submitted.value = true
  }

  function handleError() {
    submitted.value = false
  }

  const form = ref()

  import { inject } from 'vue'
  import { actions } from '@live-change/vue3-ssr'
  const workingZone = inject('workingZone')
  const { resendMessageAuthentication } = actions().messageAuthentication
  function resend() {
    workingZone.addPromise('resendMessageAuthentication', (async () => {
      const { authentication: newAuthentication } = await resendMessageAuthentication({
        authentication
      })
      if(form.value) form.value.reset()
      toast.add({ severity: 'success', summary: t('messageAuth.codeSent'), detail: t('messageAuth.newCodeSent') })

      router.push({
        name: 'user:sent',
        params: {
          authentication: newAuthentication
        }
      })
    })())
  }

  import { live, path } from '@live-change/vue3-ssr'
  const [ authenticationData ] = await Promise.all([
    live(
      path().messageAuthentication.authentication({ authentication })
    )
  ])
  if(authenticationData?.value?.state === 'used') {
    router.push(authenticationData.value.targetPage)
  }
</script>

<style>

</style>
