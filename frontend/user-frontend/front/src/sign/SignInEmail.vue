<template>
  <div class="w-full lg:w-6 md:w-9" v-shared-element:form="{ duration: '300ms', includeChildren: true }">
    <div class="surface-card p-4 shadow-2 border-round">

      <div class="text-center mb-5">
        <div class="text-900 text-3xl font-medium mb-3">Welcome Back</div>
        <span class="text-600 font-medium line-height-3">Don't have an account?</span>
        <router-link :to="{ name: 'user:signUpEmail' }"
                     class="font-medium no-underline ml-2 text-blue-500 cursor-pointer">
          Create today!</router-link>
      </div>

      <command-form service="passwordAuthentication" action="signInEmail" v-slot="{ data }"
                    @done="handleDone" keepOnDone v-if="isMounted">

        <div class="p-field mb-3">
          <label for="email" class="block text-900 font-medium mb-2">
            Email address
          </label>
          <InputText id="email" type="text" class="w-full"
                     aria-describedby="email-help" :class="{ 'p-invalid': data.emailError }"
                     v-model="data.email" />
          <small v-if="data.emailError" id="email-help" class="p-error">
            {{ t(`errors.${data.emailError}`) }}
          </small>
        </div>

        <div class="p-field mb-3">
          <label for="password" class="block text-900 font-medium mb-2">Password (optional)</label>
          <Password id="password" class="w-full" inputClass="w-full" toggleMask :feedback="false"
                    aria-describedby="password-help" :class="{ 'p-invalid': data.passwordHashError }"
                    v-model="data.passwordHash" />
          <small v-if="data.passwordHashError" id="password-help" class="p-error">
            {{ t(`errors.${data.passwordHashError}`) }}
          </small>
        </div>

        <div class="flex align-items-center justify-content-between mb-6">
          <div></div>
<!--          <div class="flex align-items-center">
            <Checkbox id="rememberme" :binary="true" class="mr-2" />
            <label for="rememberme">Remember me</label>
          </div>-->
          <router-link :to="{ name: 'user:resetPassword' }"
                       class="font-medium no-underline ml-2 text-blue-500 text-right cursor-pointer">
            Forgot password?
          </router-link>
        </div>

        <Button label="Sign In" icon="pi pi-user" class="w-full" type="submit"></Button>

      </command-form>

      <Divider v-if="accountTypes.length > 0" align="center" class="my-4">
        <span class="text-600 font-normal text-sm">OR</span>
      </Divider>

      <router-link v-for="accountType in accountTypes"
                   :to="{ name: `user:${accountType.accountType}Auth`, params: { action: 'signInOrSignUp' } }"
                   class="no-underline">
        <Button
          :label="`Sign In with ${accountType.accountType[0].toUpperCase()}${accountType.accountType.slice(1)}`"
          :icon="`pi pi-${accountType.accountType}`"
          class="w-full p-button-secondary mb-1"
        />
      </router-link>

    </div>
  </div>
</template>

<script setup>

  import InputText from "primevue/inputtext"
  import Checkbox from "primevue/checkbox"
  import Button from "primevue/button"
  import Divider from "primevue/divider"
  import Password from "../password/Password.vue"

  import { onMounted, ref } from 'vue'
  const isMounted = ref(false)
  onMounted(() => isMounted.value = true)

  import { useRouter } from 'vue-router'
  const router = useRouter()

  import { useI18n } from 'vue-i18n'
  const { t } = useI18n()

  import { getContactTypes, getAccountTypes} from '../connected/connected.js'
  const contactsTypes = getContactTypes()
  const accountTypes = getAccountTypes()

  function handleDone({ parameters, result }) {
    console.log("DONE RESULT", result)
    if(result.type === 'sent') {
      const { authentication } = result
      router.push({
        name: 'user:sent',
        params: {
          authentication
        }
      })
    } else {
      router.push({
        name: 'user:signInFinished',
      })
    }
  }

</script>

<style>

</style>
