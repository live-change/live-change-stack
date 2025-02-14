<template>
  <div class="w-full lg:w-6/12 md:w-9/12" v-shared-element:form="{ duration: '300ms', includeChildren: true }">
    <div class="bg-surface-0 dark:bg-surface-900 rounded-border shadow p-6" v-if="authenticationData?.state === 'used' && !submitted">
      <div class="text-surface-900 dark:text-surface-0 font-medium mb-4 text-xl">Authentication done</div>
      <p class="mt-0 mb-1 p-0 leading-normal">You authenticated in a different tab.</p>
    </div>
    <div class="bg-surface-0 dark:bg-surface-900 rounded-border shadow p-6" v-else>
      <div class="text-surface-900 dark:text-surface-0 font-medium mb-4 text-xl">Message sent</div>
      <p class="mt-0 mb-1 p-0 leading-normal">We sent special secret message to the contact you already provided.</p>
      <p class="mt-0 mb-6 p-0 leading-normal">Click on the link or enter the code you found in that message.</p>
      <Secured :events="['wrong-secret-code']" :actions="['checkSecretCode']">
        <command-form service="messageAuthentication" action="finishMessageAuthentication"
                      :parameters="{ secretType: 'code', authentication }" :key="authentication"
                      ref="form"
                      @submit="handleSubmit" @done="handleAuthenticated" @error="handleError"
                      v-slot="{ data }">
          <div class="flex justify-center flex-col items-center">
            <div class="p-field mx-1 flex flex-col mb-4">
              <label for="code" class="p-sr-only">Code</label>
              <InputOtp id="code"  :length="6" class="mb-2"
                         v-model="data.secret"
                         aria-describedby="code-help" :class="{ 'p-invalid': data.secretError }" />
<!--              <InputMask id="code" class="p-inputtext-lg" mask="999999" slotChar="######" placeholder="Enter code"
                         v-model="data.secret"
                         aria-describedby="code-help" :class="{ 'p-invalid': data.secretError }" />-->
              <span v-if="data.secretError" id="code-help" class="p-error">{{ t(`errors.${data.secretError}`) }}</span>
            </div>
            <div class="flex flex-col">
              <Button label="OK" type="submit" class="p-button-lg grow-0"
                      :disableda="data.secret?.length < 6" />
            </div>
          </div>
          <div v-if="data.secretError === 'codeExpired'" class="mt-4 text-center">
            <p class="mt-0 mb-2 p-0 leading-normal">To send another code click button below.</p>
            <Button label="Resend secret code" class="p-button-lg" @click="resend" />
          </div>
        </command-form>
      </Secured>
    </div>
  </div>
</template>

<script setup>
  import InputMask from "primevue/inputmask"
  import InputOtp from "primevue/inputotp"
  import Button from "primevue/button"

  import { Secured } from "@live-change/security-frontend"

  import { useRouter } from 'vue-router'
  const router = useRouter()
  import { ref } from 'vue'

  import { useToast } from 'primevue/usetoast'
  const toast = useToast()

  import { useI18n } from 'vue-i18n'
  const { t } = useI18n()

  const { authentication } = defineProps({
    authentication: {
      type: String,
      required: true
    }
  })

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
      toast.add({ severity: 'success', summary: 'Code sent', detail: 'New code sent to you' })

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
