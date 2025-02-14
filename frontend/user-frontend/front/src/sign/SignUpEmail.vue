<template>
  <div class="w-full lg:w-6/12 md:w-9/12" v-shared-element:form="{ duration: '300ms', includeChildren: true }">
    <div class="bg-surface-0 dark:bg-surface-900 p-6 shadow rounded-border">
      <div class="text-center mb-8">
        <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">Sign Up</div>
        <span class="text-surface-600 dark:text-surface-200 font-medium leading-normal">Already have an account?</span>
        <router-link :to="{ name: 'user:signInEmail' }"
                     class="font-medium no-underline ml-2 text-blue-500 cursor-pointer">
          Sign in</router-link>
      </div>

      <command-form service="messageAuthentication" action="signUpEmail" v-slot="{ data, submit }"
                    @done="handleSent" keepOnDone>

        <div class="p-field mb-4">
          <label for="email" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">
            Email address
          </label>
          <InputText id="email" type="text" class="w-full"
                     aria-describedby="email-help" :class="{ 'p-invalid': data.emailError}"
                     v-model="data.email" />
          <small v-if="data.emailError" id="email-help" class="p-error">
            {{ t(`errors.${data.emailError}`) }}
          </small>
        </div>

        <Button label="Sign Up with email" icon="pi pi-user" class="w-full" type="submit" />
      </command-form>

      <Divider v-if="accountTypes.length > 0" align="center" class="my-6">
        <b>OR</b>
      </Divider>

      <router-link v-for="accountType in accountTypes"
                   :to="{ name: `user:${accountType.accountType}Auth`, params: { action: 'signInOrSignUp' } }"
                   class="no-underline">
        <Button
          :label="`Sign Up with ${accountType.accountType[0].toUpperCase()}${accountType.accountType.slice(1)}`"
          :icon="`pi pi-${accountType.accountType}`"
          class="w-full p-button-secondary mb-1"
        />
      </router-link>

      <div class="mt-4">
        By providing your email address or google account, you consent to its processing solely
        for registration and account verification purposes, in accordance with our
        <router-link to="/privacy-policy">Privacy Policy</router-link>.
      </div>

    </div>
  </div>
</template>

<script setup>
  import InputText from "primevue/inputtext"
  import Button from "primevue/button"
  import Divider from "primevue/divider"

  import { useRouter } from 'vue-router'
  const router = useRouter()

  import { useI18n } from 'vue-i18n'
  const { t } = useI18n()

  import { getContactTypes, getAccountTypes} from '../connected/connected.js'
  const contactsTypes = getContactTypes()
  const accountTypes = getAccountTypes()

  function handleSent({ parameters, result }) {
    const { authentication } = result
    router.push({
      name: 'user:sent',
      params: {
        authentication
      }
    })
  }

</script>

<style>

</style>
