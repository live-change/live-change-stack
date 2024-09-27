<template>
  <Dialog :visible="visible" @update:visible="v => $emit('update:visible', v)"
          :modal="true" class="w-full sm:w-9 md:w-8 lg:w-6">
    <template #header>
      <h3>Invite user with email</h3>
    </template>

    <command-form service="accessControl" action="inviteEmail"
                  ref="inviteForm"
                  v-slot="{ data }"
                  :parameters="{ objectType, object }"
                  :initialValues="{ roles: availableRoles }"
                  @done="handleInvited" keepOnDone>

      <div class="flex flex-row flex-wrap align-items-center" style="margin-left: -0.5rem; margin-right: -0.5rem;">
        <div class="col-12 md:col-6 py-1">
          <div class="p-field mb-3">
            <label for="email" class="block text-900 font-medium mb-2">
              Email address
            </label>
            <InputText id="email" type="text" class="w-full"
                       aria-describedby="email-help" :class="{ 'p-invalid': data.emailError }"
                       v-model="data.email" />
            <small v-if="data.emailError" id="email-help" class="p-error">{{ t(`errors.${data.emailError}`) }}</small>
          </div>
        </div>
        <div class="col-12 md:col-6">
          <div class="p-field mb-3">
            <label for="inviteAccess" class="block text-900 font-medium mb-2">
              Roles
            </label>
            <Dropdown v-if="!multiRole" id="inviteAccess" class="w-14em w-full"
                      :options="['none'].concat(availableRoles)"
                      :optionLabel="optionLabel"
                      :modelValue="data.roles?.[0] ?? 'none'"
                      @update:modelValue="newValue => data.roles = [newValue]"
                      :feedback="false" toggleMask />
            <MultiSelect v-if="multiRole" id="inviteAccess" class="w-full"
                         :options="availableRoles"
                         :optionLabel="optionLabel"
                         v-model="data.roles"
                         :feedback="false" toggleMask />
            <small v-if="data.rolesError" id="roles-help" class="p-error">{{ t(`errors.${data.rolesError}`) }}</small>
          </div>

        </div>
      </div>
      <div class="p-field mb-1">
        <label for="inviteMessage" class="block text-900 font-medium mb-2">
          Message ( optional )
        </label>
        <Textarea id="inviteMessage" v-model="data.message" :autoResize="true" rows="3" class="w-full" />
      </div>

    </command-form>

    <template #footer>
      <Button label="Invite" icon="pi pi-envelope" autofocus @click="inviteForm.submit()" />
    </template>
  </Dialog>
</template>

<script setup>
  import Button from "primevue/button"
  import Dropdown from "primevue/dropdown"
  import MultiSelect from "primevue/multiselect"

  import Dialog from 'primevue/dialog'
  import InputText from 'primevue/inputtext'
  import Textarea from 'primevue/textarea'

  import { useToast } from 'primevue/usetoast'
  const toast = useToast()

  import { useI18n } from 'vue-i18n'
  const { t } = useI18n()

  import { ref } from 'vue'
  import { toRefs } from "@vueuse/core"

  const props = defineProps({
    object: {
      type: String,
      required: true
    },
    objectType: {
      type: String,
      required: true
    },
    visible: {
      type: Boolean,
      required: true
    },
    availableRoles: {
      type: Array,
      default: () => ['reader']
    },
    multiRole: {
      type: Boolean,
      default: false
    }
  })

  const emit = defineEmits(['update:visible'])

  const { visible, availableRoles, multiRole, object, objectType } = toRefs(props)

  function optionLabel(option) {
    if(option == 'none') return 'none'
    return option
  }

  const inviteForm = ref()
  function handleInvited() {
    emit('update:visible', false)
    toast.add({ severity:'info', summary: 'Invitation sent!', life: 1500 })
    console.log("INVITED", arguments)
  }

</script>
