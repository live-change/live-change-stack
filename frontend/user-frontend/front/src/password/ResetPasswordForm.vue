<template>
  <div class="w-full lg:w-6 md:w-9" v-shared-element:form="{ duration: '300ms', includeChildren: true }">
    <div class="surface-card border-round shadow-2 p-4" v-if="isUnknown">
      <div class="text-900 font-medium mb-3 text-xl">Unknown link</div>
      <p class="mt-0 mb-2 p-0 line-height-3">We can't find your secret link. Check if you copied the address correctly.</p>
    </div>

    <div class="surface-card border-round shadow-2 p-4" v-if="isUsed">
      <div class="text-900 font-medium mb-3 text-xl">Link used</div>
      <p class="mt-0 mb-2 p-0 line-height-3">This link was already used.</p>
    </div>

    <div class="surface-card border-round shadow-2 p-4" v-if="isExpired && !isUsed">
      <div class="text-900 font-medium mb-3 text-xl">Link expired</div>
      <p class="mt-0 mb-4 p-0 line-height-3">Your password reset authentication already expired.</p>
    </div>

    <div class="surface-card p-4 shadow-2 border-round" v-if="isReady">
      <div class="text-center mb-5">
        <div class="text-900 text-3xl font-medium mb-3">Reset password</div>
      </div>

      <command-form service="passwordAuthentication" action="finishResetPassword" v-slot="{ data }"
                    :parameters="{ key: resetKey }" ref="form"
                    @done="handleDone" keepOnDone>

        <template v-if="isMounted">
          <div class="p-field mb-3">
            <label for="newPassword" class="block text-900 font-medium mb-2">New password</label>
            <Password id="newPassword" class="w-full" inputClass="w-full" toggleMask
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
                      v-model="secondPassword"
                      :feedback="false" toggleMask />
          </div>

        </template>

        <Button type="submit" label="Reset password" icon="pi pi-key" class="w-full"></Button>

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

  const { resetKey } = defineProps({
    resetKey: {
      type: String,
      required: true
    }
  })

  import { useNow } from '@vueuse/core'
  const now = useNow({ interval: 1000 })

  import { ref, onMounted, computed } from 'vue'
  const secondPassword = ref('')
  const form = ref()
  onMounted(() => {
    form.value.addValidator('passwordHash', () => {
      const value = form.value.getFieldValue('passwordHash')
      console.log("PASSWORDS MATCH?", secondPassword.value, value)
      if(value !== secondPassword.value) return "passwordsNotMatch"
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

  const isUnknown = computed(() => authentication.value === null)
  const isExpired = computed(() =>
      authentication.value ? (now.value.toISOString() > authentication.value.expire) : false )
  const isUsed = computed(() => authentication.value && authentication.value.state === 'used')
  const isReady = computed(() => !(isUnknown.value || isExpired.value || isUsed.value))

  function handleDone({ parameters, result }) {
    console.log("DONE RESULT", result)
    router.push({
      name: 'user:resetPasswordFinished'
    })
  }
</script>

<style>

</style>
