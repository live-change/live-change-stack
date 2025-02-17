<template>
  <div class="absolute top-0 right-0 pr-6 max-h-0 flex items-center z-50">
    <router-link :to="editorRoute(objectType, object)" class="no-underline">
      <Button icon="pi pi-pencil"
              class="p-button p-button-icon-only p-button-rounded p-button-warning mr-2" />
    </router-link>
    <Button icon="pi pi-trash"
            class="p-button p-button-icon-only p-button-rounded p-button-danger"
            @click="deletePage" />
  </div>
</template>

<script setup>
  import Button from 'primevue/button'

  const props = defineProps({
    objectType: {
      type: String,
      required: true
    },
    object: {
      type: String,
      required: true
    },
    name: {
      type: String,
      default: ""
    },
    editorRoute: {
      type: Function,
      default: (objectType, object) => {
        const [service, type] = objectType.split('_')
        const prop = type[0].toLowerCase()+type.slice(1)
        return { name: `${service}:${prop}Editor`, params: { [prop+'Id']: object }}
      }
    }
  })

  import { toRefs } from "@vueuse/core"

  const { page, name } = toRefs(props)

  import { useToast } from 'primevue/usetoast'
  const toast = useToast()
  import { useConfirm } from 'primevue/useconfirm'
  const confirm = useConfirm()

  function deletePage() {
    confirm.require({
      target: event.currentTarget,
      message: `Do you want to remove page ${name} ?`,
      icon: 'pi pi-info-circle',
      acceptClass: 'p-button-danger',
      accept: async () => {
        await api.actions.content.deletePage({ page })
        toast.add({ severity:'info', summary: 'Page deleted', life: 1500 })
      },
      reject: () => {
        toast.add({ severity:'error', summary: 'Rejected', detail: 'You have rejected', life: 3000 })
      }
    })
  }

</script>

<style scoped>

</style>
