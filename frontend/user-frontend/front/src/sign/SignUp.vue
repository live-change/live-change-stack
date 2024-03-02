<template>
  <div class="w-full lg:w-6 md:w-9" v-shared-element:form="{ duration: '300ms', includeChildren: true }">
    <div class="surface-card p-4 shadow-2 border-round">
      <div class="text-center mb-5">
        <div class="text-900 text-3xl font-medium mb-3">Sign Up</div>
        <span class="text-600 font-medium line-height-3">Already have an account?</span>
        <router-link :to="{ name: 'user:signUp' }"
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
          <small v-if="data.emailError" id="email-help" class="p-error">{{ data.emailError }}</small>
        </div>

        <Button label="Sign Up with email" icon="pi pi-user" class="w-full" type="submit"></Button>

      </command-form>
    </div>
  </div>
</template>

<script setup>
  import InputText from "primevue/inputtext"
  import Checkbox from "primevue/checkbox"
  import Button from "primevue/button"
  import Divider from "primevue/divider"

  import { useRouter } from 'vue-router'
  const router = useRouter()

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
