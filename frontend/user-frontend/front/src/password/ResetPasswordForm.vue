<template>
  <div class="w-full lg:w-6/12 md:w-9/12 max-w-[32rem]" v-shared-element:form="{ duration: '300ms', includeChildren: true }">
    <div class="bg-surface-0 dark:bg-surface-900 rounded-border shadow p-6" v-if="isUnknown">
      <div class="text-surface-900 dark:text-surface-0 font-medium mb-4 text-xl">{{ t('auth.unknownLink') }}</div>
      <p class="mt-0 mb-2 p-0 leading-normal">{{ t('auth.unknownLinkDesc') }}</p>
    </div>

    <div class="bg-surface-0 dark:bg-surface-900 rounded-border shadow p-6" v-if="isUsed">
      <div class="text-surface-900 dark:text-surface-0 font-medium mb-4 text-xl">{{ t('auth.linkUsed') }}</div>
      <p class="mt-0 mb-2 p-0 leading-normal">{{ t('auth.linkUsedDesc') }}</p>
    </div>

    <div class="bg-surface-0 dark:bg-surface-900 rounded-border shadow p-6" v-if="isExpired && !isUsed">
      <div class="text-surface-900 dark:text-surface-0 font-medium mb-4 text-xl">{{ t('auth.linkExpired') }}</div>
      <p class="mt-0 mb-6 p-0 leading-normal">{{ t('auth.linkExpiredDesc') }}</p>
    </div>

    <div class="bg-surface-0 dark:bg-surface-900 p-6 shadow rounded-border" v-if="isReady || working">
      <div class="text-center mb-8">
        <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">{{ t('auth.resetPassword') }}</div>
      </div>

      <command-form service="passwordAuthentication" action="finishResetPassword" v-slot="{ data }"
                    :parameters="{ key: resetKey }" ref="form"
                    @done="handleDone" keepOnDone
                    @submit="handleSubmit" @error="handleError">

        <template v-if="isMounted">
          <div class="p-field mb-4">
            <label for="newPassword" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">{{ t('auth.newPassword') }}</label>
            <Password id="newPassword" class="w-full" inputClass="w-full" toggleMask
                      :invalid="!!data.passwordHashError"
                      v-model="data.passwordHash">
              <template #footer>
                <Divider />
                <p class="p-mt-2">{{ t('password.suggestions') }}</p>
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
                      v-model="secondPassword"
                      :feedback="false" toggleMask />
          </div>

        </template>

        <Button type="submit" :label="t('password.resetPasswordButton')" icon="pi pi-key" class="w-full"></Button>

      </command-form>
    </div>
    <div v-if="redirecting" 
         class="bg-surface-0 dark:bg-surface-900 rounded-border shadow p-6 flex justify-center">      
      <ProgressSpinner class="m-4" />
    </div>
  </div>
</template>

<script setup>
  import InputText from "primevue/inputtext"
  import Checkbox from "primevue/checkbox"
  import Button from "primevue/button"
  import Divider from "primevue/divider"
  import Password from "primevue/password"
  import Message from "primevue/message"

  const { resetKey } = defineProps({
    resetKey: {
      type: String,
      required: true
    }
  })

  import { useI18n } from 'vue-i18n'
  const { t } = useI18n()

  import { useNow } from '@vueuse/core'
  const now = useNow({ interval: 1000 })

  import { ref, onMounted, computed } from 'vue'
  const secondPassword = ref('')
  const form = ref()
  onMounted(() => {
    form.value.addValidator('passwordHash', () => {
      const value = form.value.getFieldValue('passwordHash')
      console.log("PASSWORDS MATCH?", secondPassword.value, value)
      if(value !== secondPassword.value) return "passwordNotMatch"
    })
  })

  import { useRouter } from 'vue-router'
  const router = useRouter()

  const isMounted = ref(false)
  onMounted(() => isMounted.value = true)

  import { live, path } from '@live-change/vue3-ssr'
  const [ authentication ] = await Promise.all([
    live( path().passwordAuthentication.resetPasswordAuthenticationByKey({ key: resetKey }) )
  ])

  const working = ref(false)
  const redirecting = ref(false)

  const isUnknown = computed(() => authentication.value === null)
  const isExpired = computed(() =>
      authentication.value ? (now.value.toISOString() > authentication.value.expire) : false )
  const isUsed = computed(() => !working.value && !redirecting.value && authentication.value && authentication.value.state === 'used')
  const isReady = computed(() => !(isUnknown.value || isExpired.value || isUsed.value))  

  function handleSubmit() {
    working.value = true    
  }

  function handleError() {
    working.value = false
  }

  function handleDone({ parameters, result }) {
    console.log("DONE RESULT", result)
    redirecting.value = true
    working.value = false
    router.push({
      name: 'user:resetPasswordFinished'
    })
  }
</script>

<style>

</style>
