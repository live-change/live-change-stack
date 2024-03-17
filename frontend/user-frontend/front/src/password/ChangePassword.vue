<template>
  <div class="w-full lg:w-6 md:w-9">

    <div class="surface-card p-4 shadow-2 border-round">
      <div class="text-center mb-5">
        <div class="text-900 text-3xl font-medium mb-3">
          {{ passwordExists ? 'Change password' : 'Set password' }}
        </div>
      </div>

      <command-form service="passwordAuthentication"
                    :action="passwordExists ? 'changePassword' : 'setPassword'"
                    v-slot="{ data }" ref="form" @done="handleDone">

        <template v-if="isMounted">

          <div class="p-field mb-3" v-if="passwordExists">
            <label for="currentPassword" class="block text-900 font-medium mb-2">Current password</label>
            <Password id="currentPassword" class="w-full" inputClass="w-full"
                      toggle-mask v-model:masked="masked"
                      :class="{ 'p-invalid': data.currentPasswordHashError }"
                      v-model="data.currentPasswordHash" />
            <small id="currentPassword-help" class="p-error">{{ data.currentPasswordHashError }}</small>
          </div>

          <div class="p-field mb-3">
            <label for="newPassword" class="block text-900 font-medium mb-2">New password</label>
            <Password id="newPassword" class="w-full" inputClass="w-full"
                      toggle-mask v-model:masked="masked"
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
                      toggle-mask v-model:masked="masked"
                      v-model="secondPassword"
                      :feedback="false" />
          </div>

        </template>

        <Button :label="passwordExists ? 'Change password' : 'Set password'"
                type="submit"
                icon="pi pi-key" class="w-full"></Button>

      </command-form>
    </div>

  </div>
</template>

<script setup>

  import Button from "primevue/button"
  import Divider from "primevue/divider"
  import Password from "./Password.vue"

  import { live, path } from '@live-change/vue3-ssr'
  import { computed, ref, onMounted } from 'vue'

  import { useRouter } from 'vue-router'
  const router = useRouter()

  const isMounted = ref(false)
  onMounted(() => isMounted.value = true)

  const secondPassword = ref('')
  const form = ref()

  const masked = ref(true)

  onMounted(() => {
    form.value.addValidator('passwordHash', () => {
      const value = form.value.getFieldValue('passwordHash')
      console.log("PASSWORDS MATCH?", secondPassword.value, value)
      if(value != secondPassword.value) return "passwordsNotMatch"
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
