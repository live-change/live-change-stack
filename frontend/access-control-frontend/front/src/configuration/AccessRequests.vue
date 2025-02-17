<template>
  <div v-if="synchronizedAccessRequests.length > 0" class="mb-6">
    <div class="text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">Access Requests</div>
    <div v-for="access of synchronizedAccessRequests" :key="access.to"
         class="flex flex-row flex-wrap items-center">
      <div class="col-span-12 md:col-span-6 py-1">
        <UserIdentification :ownerType="access.sessionOrUserType" :owner="access.sessionOrUser"
                            :data="access.identification" />
      </div>
      <div class="col-span-12 md:col-span-6 flex flex-row pr-0" v-if="isMounted">
        <Dropdown v-if="!multiRole && (access.roles?.length ?? 0) <= 1" id="userPublicAccess" class="w-14em"
                  style="width: calc(100% - 4.714rem) !important"
                  :options="['none'].concat(availableRoles)"
                  :optionLabel="optionLabel"
                  :modelValue="access.roles?.[0] ?? 'none'"
                  @update:modelValue="newValue => access.roles = [newValue]"
                  :feedback="false" toggleMask
                  :disabled="disabled" />
        <MultiSelect v-else id="userPublicAccess"
                     style="width: calc(100% - 4.714rem) !important"
                     :options="availableRoles"
                     :optionLabel="optionLabel"
                     v-model="access.roles"
                     :feedback="false" toggleMask
                     :disabled="disabled" />
        <Button @click="acceptAccessRequest(access)" icon="pi pi-check"
                class="p-button-rounded p-button-text p-button-plain ml-2 px-4"
                style="padding-top: 0.77rem"
                :disabled="disabled" />
        <Button @click="deleteAccessRequest(access)" icon="pi pi-times"
                class="p-button-rounded p-button-text p-button-plain px-4"
                style="padding-top: 0.77rem"
                :disabled="disabled" />
      </div>
    </div>
  </div>
</template>

<script setup>

  import Button from "primevue/button"
  import Dropdown from "primevue/dropdown"
  import MultiSelect from "primevue/multiselect"

  import { useToast } from 'primevue/usetoast'
  const toast = useToast()
  import { useConfirm } from 'primevue/useconfirm'
  const confirm = useConfirm()

  import { UserIdentification } from "@live-change/user-frontend"
  import { synchronized, synchronizedList } from "@live-change/vue3-components"

  import { computed, watch, ref, onMounted } from 'vue'

  const { object, objectType, availableRoles, multiRole, disabled } = defineProps({
    object: {
      type: String,
      required: true
    },
    objectType: {
      type: String,
      required: true
    },
    availableRoles: {
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

  function optionLabel(option) {
    if(option == 'none') return 'none'
    return option
  }

  import { path, live, actions } from '@live-change/vue3-ssr'
  const accessControlApi = actions().accessControl

  const [ accessRequests ] = await Promise.all([
    live(path().accessControl.objectOwnedAccessRequests({ object, objectType })
        .with(access => path().userIdentification.identification({
          sessionOrUserType: access.sessionOrUserType, sessionOrUser: access.sessionOrUser
        }).bind('identification'))
        .action('delete', ({ sessionOrUserType, sessionOrUser, objectType, object }) =>
          path().accessControl.resetAccessRequest(
            { sessionOrUserType, sessionOrUser, objectType, object }
          )
        )
    )
  ])

  const synchronizedAccessRequestsList = synchronizedList({
    source: accessRequests,
    update: accessControlApi.updateAccessRequest,
    delete: accessControlApi.resetAccessRequest,
    identifiers: { object, objectType },
    objectIdentifiers: ({ to, sessionOrUser, sessionOrUserType }) =>
        ({ accessRequest: to, sessionOrUser, sessionOrUserType, object, objectType }),
    onSave: () => toast.add({ severity: 'info', summary: 'Access request saved', life: 1500 }),
    recursive: true
  })
  const synchronizedAccessRequests = synchronizedAccessRequestsList.value

  function deleteAccessRequest(accessRequest) {
    console.log("DELETE ACCESS REQUEST", accessRequest)
    confirm.require({
      target: event.currentTarget,
      message: `Do you want to delete user "${accessRequest.identification.name}" access request?`,
      icon: 'pi pi-info-circle',
      acceptClass: 'p-button-danger',
      accept: async () => {
        await synchronizedAccessRequestsList.delete(accessRequest)
        //accessRequest.delete()
        toast.add({ severity:'info', summary: 'Access Request Deleted', life: 1500 })
      },
      reject: () => {
        toast.add({ severity:'error', summary: 'Rejected', detail: 'You have rejected', life: 3000 })
      }
    })
  }

  async function acceptAccessRequest(accessRequest) {
    console.log("ACCEPT ACCESS REQUEST", accessRequest)
    await accessControlApi.acceptAccessRequest({
      ...accessRequest, access: accessRequest.to
    })
    toast.add({ severity:'info', summary: 'Access Request accepted', life: 1500 })
  }

</script>
