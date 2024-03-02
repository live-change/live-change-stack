<template>
  <div class="w-full lg:w-6 md:w-9" v-shared-element:form="{ duration: '300ms', includeChildren: true }">
    <div class="surface-card p-4 shadow-2 border-round">
      <div class="text-center mb-5">
        <div class="text-900 text-3xl font-medium mb-3">Reset password</div>
      </div>

      <command-form service="passwordAuthentication" action="resetPasswordEmail" v-slot="{ data }"
                    @done="handleDone" keepOnDone v-if="isMounted">

        <div class="p-field mb-3">
          <label for="email" class="block text-900 font-medium mb-2">
            Email address
          </label>
          <InputText id="email" type="text" class="w-full"
                     v-model="data.email" :class="{ 'p-invalid': data.emailError }"
                     aria-describedby="email-help" />
          <small id="email-help" class="p-error">{{ data.emailError }}</small>
        </div>

        <Button type="submit" label="Reset password" icon="pi pi-key" class="w-full"></Button>

      </command-form>
    </div>
  </div>
</template>

<script setup>
  import InputText from "primevue/inputtext"
  import Button from "primevue/button"

  import { onMounted, ref } from "vue"
  const isMounted = ref(false)
  onMounted(() => isMounted.value = true)

  import { useRouter } from 'vue-router'
  const router = useRouter()

  function handleDone({ parameters, result }) {
    console.log("DONE RESULT", result)
    const { authentication } = result
    router.push({
      name: 'user:sent',
      params: {
        authentication
      }
    })
  }

  await new Promise(r=>setTimeout(r, 800))

</script>

<style>

</style>
