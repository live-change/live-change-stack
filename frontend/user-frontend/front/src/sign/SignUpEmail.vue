<template>
  <div class="w-full lg:w-6 md:w-9" v-shared-element:form="{ duration: '300ms', includeChildren: true }">
    <div class="surface-card p-4 shadow-2 border-round">
      <div class="text-center mb-5">
        <div class="text-900 text-3xl font-medium mb-3">Sign Up</div>
        <span class="text-600 font-medium line-height-3">Already have an account?</span>
        <router-link :to="{ name: 'user:signInEmail' }"
                     class="font-medium no-underline ml-2 text-blue-500 cursor-pointer">
          Sign in</router-link>
      </div>

      <command-form service="messageAuthentication" action="signUpEmail" v-slot="{ data, submit }"
                    @done="handleSent" keepOnDone>

        <div class="p-field mb-3">
          <label for="email" class="block text-900 font-medium mb-2">
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

      <Divider align="center" class="my-4">
        <span class="text-600 font-normal text-sm">OR</span>
      </Divider>

      <!--        <Button label="Sign In with GitHub" icon="pi pi-github" class="w-full p-button-secondary mb-2" />-->
      <router-link :to="{ name: 'user:googleAuth', params: { action: 'signInOrSignUp' } }" class="no-underline">
        <Button
          label="Sign Up with Google"
          icon="pi pi-google"
          class="w-full p-button-secondary mb-1"
        />
      </router-link>

      <div class="mt-3">
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
