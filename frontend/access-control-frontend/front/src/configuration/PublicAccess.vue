<template>
  <div class="grid grid-cols-12 gap-4 formgrid p-fluid mb-2">
    <div class="p-field field mb-6 col-span-12 md:col-span-6" v-if="isMounted && sessionRolesVisible">
      <label for="publicAccess" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">Public access:</label>
      <Dropdown v-if="!multiRole && (synchronizedPublicAccess.sessionRoles?.length ?? 0) <= 1"
                id="publicAccess" class="w-full" inputClass="w-full"
                :options="['none'].concat(availableSessionRoles)"
                :optionLabel="optionLabel"
                :modelValue="synchronizedPublicAccess.sessionRoles?.[0] ?? 'none'"
                @update:modelValue="newValue => synchronizedPublicAccess.sessionRoles = [newValue]"
                :feedback="false" toggleMask :disabled="disabled" />
      <MultiSelect v-else
                   id="publicAccess" class="w-full" inputClass="w-full"
                   :options="availableSessionRoles"
                   :optionLabel="optionLabel"
                   v-model="synchronizedPublicAccess.sessionRoles"
                   :feedback="false" toggleMask :disabled="disabled" />
    </div>
    <div class="p-field field mb-6 col-span-12 md:col-span-6" v-if="isMounted && userRolesVisible">
      <label for="userPublicAccess" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">Public access for users:</label>
      <Dropdown v-if="!multiRole && (synchronizedPublicAccess.userRoles?.length ?? 0) <= 1"
                id="userPublicAccess" class="w-full" inputClass="w-full"
                :options="['none'].concat(availableUserRoles)"
                :optionLabel="optionLabel"
                :modelValue="synchronizedPublicAccess.userRoles?.[0] ?? 'none'"
                @update:modelValue="newValue => synchronizedPublicAccess.userRoles = [newValue]"
                :feedback="false" toggleMask :disabled="disabled" />
      <MultiSelect v-else id="userPublicAccess" class="w-full" inputClass="w-full"
                   :options="availableUserRoles"
                   :optionLabel="optionLabel"
                   v-model="synchronizedPublicAccess.userRoles"
                   :feedback="false" toggleMask :disabled="disabled" />
    </div>
    <div class="p-field field mb-6" v-if="isMounted && requestedRolesVisible"
         :class="autoGrantRequestsVisible ? 'col-6' : 'col-12'">
      <label for="availablePublicAccess" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">Roles available to request:</label>
      <MultiSelect id="userPublicAccess" class="w-full" inputClass="w-full"
                   :options="availableRequestedRoles"
                   :optionLabel="optionLabel"
                   v-model="synchronizedPublicAccess.availableRoles"
                   :feedback="false" toggleMask :disabled="disabled" />
    </div>
    <div class="p-field field mb-6 col-span-6" v-if="isMounted && autoGrantRequestsVisible">
      <label for="autoGrantRequests" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">
        Automatically grant number of requests:
      </label>
      <InputNumber id="autoGrantRequests" class="w-full" inputClass="w-full"
                   v-model="synchronizedPublicAccess.autoGrantRequests" showButtons
                   :min="0" :max="100" :step="1" mode="decimal" :feedback="false" :disabled="disabled" />
    </div>
  </div>
</template>

<script setup>
  import Dropdown from "primevue/dropdown"
  import MultiSelect from "primevue/multiselect"
  import InputNumber from "primevue/inputnumber"

  import { useToast } from 'primevue/usetoast'
  const toast = useToast()

  import { synchronized } from "@live-change/vue3-components"

  function optionLabel(option) {
    if(option == 'none') return 'none'
    return option
  }

  import { computed, watch, ref, onMounted } from 'vue'

  const {
    object, objectType,
    availableRequestedRoles, availableSessionRoles, availableUserRoles,
    sessionRolesVisible, userRolesVisible, requestedRolesVisible,
    multiRole, disabled
  } = defineProps({
    object: {
      type: String,
      required: true
    },
    objectType: {
      type: String,
      required: true
    },
    sessionRolesVisible: {
      type: Boolean,
      default: true
    },
    userRolesVisible: {
      type: Boolean,
      default: true
    },
    requestedRolesVisible: {
      type: Boolean,
      default: true
    },
    autoGrantRequestsVisible: {
      type: Boolean,
      default: true
    },
    availableRequestedRoles: {
      type: Array,
      default: () => ['reader']
    },
    availableSessionRoles: {
      type: Array,
      default: () => ['reader']
    },
    availableUserRoles: {
      type: Array,
      default: () => ['reader']
    },
    multiRole: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    }
  })

  const isMounted = ref(false)
  onMounted(() => isMounted.value = true)

  import { path, live, actions } from '@live-change/vue3-ssr'
  const accessControlApi = actions().accessControl

  const [ publicAccess ] = await Promise.all([
    live(path().accessControl.publicAccess({ object, objectType }))
  ])

  const synchronizedPublicAccess = synchronized({
    source: publicAccess,
    update: accessControlApi.setOrUpdatePublicAccess,
    identifiers: { object, objectType },
    recursive: true,
    onSave: () => toast.add({ severity: 'info', summary: 'Public access saved', life: 1500 })
  }).value

</script>
