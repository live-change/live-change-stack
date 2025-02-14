<template>
  <div class="w-full lg:w-6 md:w-9" v-shared-element:form="{ duration: '300ms', includeChildren: true }">
    <div class="surface-card border-round shadow-2 p-4">
      <div class="text-center mb-5">
        <div class="text-900 text-3xl font-medium mb-3">
          Signed Up
        </div>
      </div>
      <p class="mt-0 p-0 line-height-3">
        Congratulations! You have successfully created your account.
        <span v-if="needPassword && !afterSignIn">
          You can now set password to secure your account.
        </span>
        <div v-else-if="afterSignIn" class="flex flex-row justify-content-center align-items-center">
          <router-link :to="afterSignIn" class="no-underline">
            <Button label="Next" v-ripple />
          </router-link>
          <p class="ml-4" v-if="isMounted && redirectTime">
            Redirect in {{ pluralize('second', Math.ceil((redirectTime - currentTime) / 1000), true) }}...
          </p>
        </div>
        <p v-else>

          Setup your <router-link :to="{ name: 'user:identification' }">profile</router-link>
          or return to the <router-link to="/">index page</router-link>.
        </p>
      </p>
    </div>

    <div class="surface-card p-4 shadow-2 border-round mt-2" v-if="needPassword && !afterSignIn">
      <div class="text-center mb-5">
        <div class="text-900 text-3xl font-medium mb-3">
          {{ passwordExists ? 'Change password' : 'Set password' }}
        </div>
      </div>

      <command-form service="passwordAuthentication"
                    :action="passwordExists ? 'changePassword' : 'setPassword'"
                    v-slot="{ data }" ref="form" @done="handleDone">

        <template v-if="isMounted">

          <div class="p-field mb-3">
            <label for="newPassword" class="block text-900 font-medium mb-2">New password</label>
            <Password id="newPassword" class="w-full" inputClass="w-full"
                      toggleMask v-model:masked="masked"
                      :class="{ 'p-invalid': data.passwordHashError }"
                      v-model="data.passwordHash">
              <template #footer>
                <Divider />
                <p class="p-mt-2">Suggestions</p>
                <ul class="p-pl-2 p-ml-2 p-mt-0" style="line-height: 1.5">
                  <li>At least one lowercase</li>
                  <li>At least one uppercase</li>
                  <li>At least one numeric</li>
                  <li>Minimum 8 characters</li>
                </ul>
              </template>
            </Password>
            <small id="newPassword-help" class="p-error">{{ data.passwordHashError }}</small>
          </div>

          <div class="p-field mb-3">
            <label for="reenterPassword" class="block text-900 font-medium mb-2">Re-enter password</label>
            <Password id="reenterPassword" class="w-full" inputClass="w-full"
                      toggleMask v-model:masked="masked"
                      v-model="secondPassword"
                      :feedback="false" />
          </div>

        </template>

        <Button :label="passwordExists ? 'Change password' : 'Set password'"
                type="submit"
                icon="pi pi-key" class="w-full"></Button>

      </command-form>
    </div>


  </div>
</template>

<script setup>

  import Button from "primevue/button"
  import Divider from "primevue/divider"
  import Password from "../password/Password.vue"

  import { live, path, useApi } from '@live-change/vue3-ssr'
  const api = useApi()
  import { computed, ref, onMounted, onUnmounted } from 'vue'

  import { currentTime } from "@live-change/frontend-base"

  import pluralize from 'pluralize'

  import { useRouter } from 'vue-router'
  const router = useRouter()

  const isMounted = ref(false)
  onMounted(() => isMounted.value = true)

  const secondPassword = ref('')
  const form = ref()

  const masked = ref(true)

  import { useToast } from 'primevue/usetoast'
  const toast = useToast()
  import { useConfirm } from 'primevue/useconfirm'
  const confirm = useConfirm()

  const userClientConfig = api.getServiceDefinition('user')?.clientConfig

  const [passwordExists, emails, phones] = await Promise.all([
    live(path().passwordAuthentication.myUserPasswordAuthenticationExists()),
    live(path().email?.myUserEmails()),
    live(path().phone?.myUserPhones())
  ])

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
      console.log("DO REDIRECT START", route, delay)
      if(delay) {
        redirectTime.value = new Date(Date.now() + delay * 1000)
        redirectTimeout = setTimeout(() => {
          console.log("DO DELAYED REDIRECT AFTER SIGN UP!", route)
          router.push(route)
        }, redirectTime.value - currentTime.value)
      } else {
        setTimeout(() => { // it could be next tick
          console.log("DO REDIRECT AFTER SIGN UP!", route)
          toast.add({
            severity: 'info', life: 6000,
            summary: 'Signed up',
            detail: 'Congratulations! You have successfully created your account.'
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
    console.log("DONE WAITING FOR USER!")
    if(!finished) doRedirect()
  })
  onUnmounted(() => {
    finished = true
    if(redirectTime.value) clearTimeout(redirectTimeout)
  })

  const needPassword = computed(() => (!passwordExists.value
    && (emails.value?.length > 0 || phones.value?.length > 0)
  ))

  function handleDone({ parameters, result }) {
    console.log("FORM DONE", parameters, result)
 /*   router.push({
      name: 'user:changePasswordFinished',
    })*/
  }

</script>

<style>

</style>
