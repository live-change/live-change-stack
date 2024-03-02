<template>
  <div class="w-full lg:w-6 md:w-9" v-shared-element:form="{ duration: '300ms', includeChildren: true }">
    <div class="surface-card p-4 shadow-2 border-round">
      <div class="text-center mb-5">
        <div class="text-900 text-3xl font-medium mb-3">Welcome Back</div>
        <span class="text-600 font-medium line-height-3">Don't have an account?</span>
        <router-link :to="{ name: 'user:signUp' }"
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
          <small id="email-help" class="p-error">{{ data.emailError }}</small>
        </div>

        <div class="p-field mb-3">
          <label for="password" class="block text-900 font-medium mb-2">Password (optional)</label>
          <Password id="password" class="w-full" inputClass="w-full" toggleMask
                    aria-describedby="password-help" :class="{ 'p-invalid': data.passwordHashError }"
                    v-model="data.passwordHash" />
          <small id="password-help" class="p-error">{{ data.passwordHashError }}</small>
        </div>

        <div class="flex align-items-center justify-content-between mb-6">
          <div class="flex align-items-center">
            <Checkbox id="rememberme" :binary="true" class="mr-2"></Checkbox>
            <label for="rememberme">Remember me</label>
          </div>
          <router-link :to="{ name: 'user:resetPassword' }"
                       class="font-medium no-underline ml-2 text-blue-500 text-right cursor-pointer">
            Forgot password?
          </router-link>
        </div>

        <Button label="Sign In" icon="pi pi-user" class="w-full" type="submit"></Button>

        <Divider align="center" class="my-4">
          <span class="text-600 font-normal text-sm">OR</span>
        </Divider>

        <Button label="Sign In with GitHub" icon="pi pi-github" class="w-full p-button-secondary mb-2"></Button>
        <Button label="Sign In with Google" icon="pi pi-google" class="w-full p-button-secondary mb-1"></Button>

      </command-form>
    </div>
  </div>
</template>

<script setup>

  import InputText from "primevue/inputtext"
  import Checkbox from "primevue/checkbox"
  import Button from "primevue/button"
  import Divider from "primevue/divider"
  import Password from "primevue/password"

  import { onMounted, ref } from 'vue'
  const isMounted = ref(false)
  onMounted(() => isMounted.value = true)

  import { useRouter } from 'vue-router'
  const router = useRouter()

  function handleDone({ parameters, result }) {
    console.log("DONE RESULT", result)
    if(result.type == 'sent') {
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
