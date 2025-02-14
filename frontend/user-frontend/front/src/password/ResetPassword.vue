<template>
  <div class="w-full lg:w-6/12 md:w-9/12" v-shared-element:form="{ duration: '300ms', includeChildren: true }">
    <div class="bg-surface-0 dark:bg-surface-900 p-6 shadow rounded-border">
      <div class="text-center mb-8">
        <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">Reset password</div>
      </div>

      <command-form service="passwordAuthentication" action="resetPasswordEmail" v-slot="{ data }"
                    @done="handleDone" keepOnDone v-if="isMounted">

        <div class="p-field mb-4">
          <label for="email" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">
            Email address
          </label>
          <InputText id="email" type="text" class="w-full"
                     v-model="data.email" :class="{ 'p-invalid': data.emailError }"
                     aria-describedby="email-help" />
          <small v-if="data.emailError" id="email-help" class="p-error">{{ t(`errors.${data.emailError}`) }}</small>
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

  import { useI18n } from 'vue-i18n'
  const { t } = useI18n()

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
