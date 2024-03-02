<template>
  <div class="mb-4">
    <div v-if="isAccessible">
      <div  class="mb-4">
        <div class="text-900 text-xl font-medium mb-2">
          Canonical Url
        </div>
        <div v-if="canonical">
          <div class="w-full flex flex-wrap flex-row align-items-center">
            <span class="text-right overflow-hidden text-overflow-ellipsis mr-1">
              {{ canonical.domain || '*' }}
            </span>
            <span class="flex-grow-1">
              /{{ canonical.path }}
            </span>
            <Button icon="pi pi-pencil" label="Edit" class="p-button-warning mr-1" @click="editCanonical" />
            <Button icon="pi pi-trash" label="Delete" class="p-button-danger" @click="deleteCanonical"/>

            <Dialog :visible="editCanonicalDialogVisible" @update:visible="v => editCanonicalDialogVisible = v"
                    :modal="true" class="w-full sm:w-9 md:w-8 lg:w-6">
              <template #header>
                <h3>Edit canonical url</h3>
              </template>
              <TakeUrlForm :initialValues="canonical" :targetType="targetType" :target="target"
                           @taken="handleCanonicalEdited" />
            </Dialog>
          </div>
        </div>
        <div v-else>
          <TakeUrlForm :targetType="targetType" :target="target"
                       @taken="handleTaken" />
        </div>
      </div>

      <div v-if="redirects.length > 0">
        <div class="text-900 text-xl font-medium mb-2">
          Redirects
        </div>
        <div class="w-full flex flex-wrap flex-row align-items-center mb-1" v-for="url of redirects" :key="url.to">
          <span class="text-right overflow-hidden text-overflow-ellipsis mr-1">
            {{ url.domain || '*' }}
          </span>
          <span class="flex-grow-1">
            /{{ url.path }}
          </span>
          <Button icon="pi pi-trash" label="Delete" class="p-button-danger" @click="() => deleteRedirect(url)"/>
        </div>
      </div>

      <div class="mt-2 mb-2">
        <Button icon="pi pi-plus" label="Add redirect" class="p-button-warning" click="showAddRedirectDialog"
                @click="showCreateRedirectDialog" />
      </div>

      <Dialog :visible="createRedirectDialogVisible" @update:visible="v => createRedirectDialogVisible = v"
              :modal="true" class="w-full sm:w-9 md:w-8 lg:w-6">
        <template #header>
          <h3>Add redirect</h3>
        </template>
        <TakeUrlForm redirect :targetType="targetType" :target="target" @taken="handleRedirectCreated" />
      </Dialog>
    </div>
    <div v-else>
      Urls editor access denied
    </div>
  </div>
</template>

<script setup>

  import Button from "primevue/button"
  import InputText from "primevue/inputtext"
  import Dialog from "primevue/dialog"

  import TakeUrlForm from "./TakeUrlForm.vue"

  import { useToast } from 'primevue/usetoast'
  const toast = useToast()
  import { useConfirm } from 'primevue/useconfirm'
  const confirm = useConfirm()

  import { computed, watch, ref, onMounted } from 'vue'

  const isMounted = ref(false)
  onMounted(() => isMounted.value = true)

  const { target, targetType } = defineProps({
    target: {
      type: String,
      required: true
    },
    targetType: {
      type: String,
      required: true
    }
  })

  import { path, live, actions, serviceDefinition } from '@live-change/vue3-ssr'
  const urlsApi = actions().url

  const isAccessible = serviceDefinition('url').views.targetOwnedCanonical
  const isEditable = serviceDefinition('url').views.resetTargetOwnedCanonical

  const editCanonicalDialogVisible = ref(false)
  const createRedirectDialogVisible = ref(false)

  function handleTaken(data) {
  }

  function editCanonical() {
    editCanonicalDialogVisible.value = true
  }
  function handleCanonicalEdited() {
    editCanonicalDialogVisible.value = false
  }
  function deleteCanonical() {
    confirm.require({
      target: event.currentTarget,
      message: `Do you want to delete canonical url?`,
      icon: 'pi pi-info-circle',
      acceptClass: 'p-button-danger',
      accept: async () => {
        await urlsApi.resetTargetOwnedCanonical({ target, targetType })
        toast.add({ severity:'info', summary: 'Canonical url deleted', life: 1500 })
      },
      reject: () => {
        toast.add({ severity:'error', summary: 'Rejected', detail: 'You have rejected', life: 3000 })
      }
    })
  }

  function deleteRedirect(redirect) {
    confirm.require({
      target: event.currentTarget,
      message: `Do you want to delete redirect ${redirect.domain || '*'}/${redirect.path}?`,
      icon: 'pi pi-info-circle',
      acceptClass: 'p-button-danger',
      accept: async () => {
        await urlsApi.deleteTargetOwnedRedirect({ redirect: redirect.to, target, targetType })
        toast.add({ severity:'info', summary: 'Redirect deleted', life: 1500 })
      },
      reject: () => {
        toast.add({ severity:'error', summary: 'Rejected', detail: 'You have rejected', life: 3000 })
      }
    })
  }
  function showCreateRedirectDialog() {
    createRedirectDialogVisible.value = true
  }
  function handleRedirectCreated() {
    createRedirectDialogVisible.value = false
  }

  const [ canonical, redirects ] = isAccessible ? (await Promise.all([
    live(path().url.targetOwnedCanonical({ target, targetType })),
    live(path().url.targetOwnedRedirects({ target, targetType })
      .action('delete', ({ to, target, targetType }) =>
        path().url.deleteTargetOwnedRedirect({ redirect: to, target, targetType })
      )
    )
  ])) : [null, []]

</script>

<style scoped>

</style>
