<template>
  <div class="w-full lg:w-6 md:w-9" v-shared-element:form="{ duration: '300ms', includeChildren: true }">
    <div class="surface-card border-round shadow-2 p-4" v-if="authenticationData?.state == 'used' && !submitted">
      <div class="text-900 font-medium mb-3 text-xl">Authentication done</div>
      <p class="mt-0 mb-1 p-0 line-height-3">You authenticated in a different tab.</p>
    </div>
    <div class="surface-card border-round shadow-2 p-4" v-else>
      <div class="text-900 font-medium mb-3 text-xl">Message sent</div>
      <p class="mt-0 mb-1 p-0 line-height-3">We sent special secret message to your email.</p>
      <p class="mt-0 mb-4 p-0 line-height-3">Click on the link or enter the code you found in that message.</p>
      <Secured :events="['wrong-secret-code']" :actions="['checkSecretCode']">
        <command-form service="messageAuthentication" action="finishMessageAuthentication"
                      :parameters="{ secretType: 'code', authentication }" :key="authentication"
                      @submit="handleSubmit" @done="handleAuthenticated" @error="handleError"
                      v-slot="{ data }">
          <div class="flex justify-content-center">
            <div class="p-field mr-1 flex flex-column">
              <label for="code" class="p-sr-only">Code</label>
              <InputMask id="code" class="p-inputtext-lg" mask="999999" slotChar="######" placeholder="Enter code"
                         v-model="data.secret"
                         aria-describedby="code-help" :class="{ 'p-invalid': data.secretError }" />
              <span v-if="data.secretError" id="code-help" class="p-error">{{ data.secretError }}</span>
            </div>
            <div class="flex flex-column">
              <Button label="OK" type="submit" class="p-button-lg flex-grow-0"></Button>
            </div>
          </div>
          <div v-if="data.secretError == 'codeExpired'">
            <p class="mt-0 mb-4 p-0 line-height-3">To send another code click button below.</p>
            <Button label="Resend" class="p-button-lg" @click="resend"></Button>
          </div>
        </command-form>
      </Secured>
    </div>
  </div>
</template>

<script setup>
  import InputMask from "primevue/inputmask"
  import Button from "primevue/button"

  import { Secured } from "@live-change/security-frontend"

  import { useRouter } from 'vue-router'
  import { ref } from 'vue'

  const router = useRouter()

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

  import { inject } from 'vue'
  import { actions } from '@live-change/vue3-ssr'
  const workingZone = inject('workingZone')
  const { resendMessageAuthentication } = actions().messageAuthentication
  function resend() {
    workingZone.addPromise('resendMessageAuthentication', (async () => {
      const { authentication: newAuthentication } = await resendMessageAuthentication({
        authentication
      })
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
  if(authenticationData?.value?.state == 'used') {
    router.push(authenticationData.value.targetPage)
  }
</script>

<style>

</style>
