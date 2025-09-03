<template>
  <div class="w-full lg:w-6/12 md:w-9/12 max-w-[32rem]">

    <div class="bg-surface-0 dark:bg-surface-900 p-6 shadow rounded-border">
      <div class="text-center mb-8">
        <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">
          {{ passwordExists ? t('auth.changePassword') : t('auth.setPassword') }}
        </div>
      </div>

      <command-form service="passwordAuthentication"
                    :action="passwordExists ? 'changePassword' : 'setPassword'"
                    v-slot="{ data }" ref="form" @done="handleDone">

        <template v-if="isMounted">

          <div class="p-field mb-4" v-if="passwordExists">
            <label for="currentPassword" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">{{ t('auth.currentPassword') }}</label>
            <Password id="currentPassword" class="w-full" inputClass="w-full"
                      toggle-mask v-model:masked="masked"
                      :invalid="!!data.currentPasswordHashError"
                      v-model="data.currentPasswordHash" />
            <Message v-if="data.currentPasswordHashError" severity="error" variant="simple" size="small">
              {{ t(`errors.${data.currentPasswordHashError}`) }}
            </Message>
          </div>

          <div class="p-field mb-4">
            <label for="newPassword" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">{{ t('auth.newPassword') }}</label>
            <Password id="newPassword" class="w-full" inputClass="w-full"
                      toggle-mask v-model:masked="masked"
                      :invalid="!!data.passwordHashError"
                      v-model="data.passwordHash">
              <template #footer>
                <Divider />
                <p class="p-mt-2">{{ t('auth.passwordSuggestions') }}</p>
                <ul class="p-pl-2 p-ml-2 p-mt-0" style="line-height: 1.5">
                  <li>{{ t('auth.suggestionLowercase') }}</li>
                  <li>{{ t('auth.suggestionUppercase') }}</li>
                  <li>{{ t('auth.suggestionNumeric') }}</li>
                  <li>{{ t('auth.suggestionMinLength') }}</li>
                </ul>
              </template>
            </Password>
            <Message v-if="data.passwordHashError" severity="error" variant="simple" size="small">
              {{ t(`errors.${data.passwordHashError}`) }}
            </Message>
          </div>

          <div class="p-field mb-4">
            <label for="reenterPassword" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">{{ t('auth.reenterPassword') }}</label>
            <Password id="reenterPassword" class="w-full" inputClass="w-full"
                      toggle-mask v-model:masked="masked"
                      v-model="secondPassword"
                      :feedback="false" />
          </div>

        </template>

        <Button :label="passwordExists ? t('auth.changePassword') : t('auth.setPassword')"
                type="submit"
                icon="pi pi-key" class="w-full"></Button>

      </command-form>
    </div>

  </div>
</template>

<script setup>

  import Button from "primevue/button"
  import Divider from "primevue/divider"
  import Message from "primevue/message"
  import Password from "./Password.vue"

  import { live, path } from '@live-change/vue3-ssr'
  import { computed, ref, onMounted } from 'vue'

  import { useRouter } from 'vue-router'
  const router = useRouter()

  import { useI18n } from 'vue-i18n'
  const { t } = useI18n()

  const isMounted = ref(false)
  onMounted(() => isMounted.value = true)

  const secondPassword = ref('')
  const form = ref()

  const masked = ref(true)

  onMounted(() => {
    form.value.addValidator('passwordHash', () => {
      const value = form.value.getFieldValue('passwordHash')
      console.log("PASSWORDS MATCH?", secondPassword.value, value)
      if(value !== secondPassword.value) return "passwordNotMatch"
    })
  })


  const passwordExists = await live(path().passwordAuthentication.myUserPasswordAuthenticationExists())

  function handleDone({ parameters, result }) {
    console.log("FORM DONE", parameters, result)
    router.push({
      name: 'user:changePasswordFinished',
    })
  }

</script>

<style>

</style>
