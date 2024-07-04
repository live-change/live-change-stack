<template>
  <div v-if="synchronizedAccessInvitations.length > 0" class="mb-4">
    <div class="text-900 font-medium text-xl mb-2">Access Invitations</div>
    <div v-for="access of synchronizedAccessInvitations" :key="access.to"
         class="flex flex-row flex-wrap align-items-center">
      <div class="col-12 md:col-6 py-1">
        <UserIdentification :ownerType="access.contactOrUserType" :owner="access.contactOrUser"
                            :data="access.identification" />
      </div>
      <div class="col-12 md:col-6 flex flex-row pr-0" v-if="isMounted">
        <Dropdown v-if="!multiRole && (access.roles?.length ?? 0) <= 1" id="userPublicAccess" class="w-14em"
                  style="width: calc(100% - 2.357rem) !important"
                  :options="['none'].concat(availableRoles)"
                  :optionLabel="optionLabel"
                  :modelValue="access.roles?.[0] ?? 'none'"
                  @update:modelValue="newValue => access.roles = [newValue]"
                  :feedback="false" toggleMask :disabled="disabled" />
        <MultiSelect v-else id="userPublicAccess"
                     style="width: calc(100% - 2.357rem) !important"
                     :options="availableRoles"
                     :optionLabel="optionLabel"
                     v-model="access.roles"
                     :feedback="false" toggleMask :disabled="disabled" />
        <Button @click="deleteAccessInvitation(access)" icon="pi pi-times"
                class="p-button-rounded p-button-text p-button-plain ml-2 px-3"
                style="padding-top: 0.77rem" :disabled="disabled" />
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
    if(option === 'none') return 'none'
    return option
  }

  import { path, live, actions } from '@live-change/vue3-ssr'
  const accessControlApi = actions().accessControl

  const [ accessInvitations ] = await Promise.all([
    live(path().accessControl.objectOwnedAccessInvitations({ object, objectType })
        .with(access => path().userIdentification.sessionOrUserOwnedIdentification({
          sessionOrUserType: access.contactOrUserType, sessionOrUser: access.contactOrUser
        }).bind('identification'))
    )
  ])

  const synchronizedAccessInvitationsList = synchronizedList({
    source: accessInvitations,
    update: accessControlApi.updateContactOrUserAndObjectOwnedAccessInvitation,
    delete: accessControlApi.resetContactOrUserAndObjectOwnedAccessInvitation,
    identifiers: { object, objectType },
    objectIdentifiers: ({ to, sessionOrUser, sessionOrUserType }) =>
        ({ accessInvitation: to, sessionOrUser, sessionOrUserType, object, objectType }),
    onSave: () => toast.add({ severity: 'info', summary: 'Access invite saved', life: 1500 }),
    recursive: true
  })
  const synchronizedAccessInvitations = synchronizedAccessInvitationsList.value

  function deleteAccessInvitation(accessInvitation) {
    console.log("DELETE ACCESS INVITE", accessInvitation)
    confirm.require({
      target: event.currentTarget,
      message: `Do you want to delete user "${accessInvitation?.identification?.name ?? accessInvitation.to}" invitation?`,
      icon: 'pi pi-info-circle',
      acceptClass: 'p-button-danger',
      accept: async () => {
        await synchronizedAccessInvitationsList.delete(accessInvitation)
        /*await accessControlApi.deleteObjectRelatedAccess({
          access: access.to, object: access.object, objectType: access.objectType
        })*/
        toast.add({ severity:'info', summary: 'Invitation Deleted', life: 1500 })
      },
      reject: () => {
        toast.add({ severity:'error', summary: 'Rejected', detail: 'You have rejected', life: 3000 })
      }
    })
  }

</script>
