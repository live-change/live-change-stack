<template>
  <div class="absolute top-0 right-0 pr-4 max-h-0 flex align-items-center z-5">
    <Button icon="pi pi-plus"
            class="p-button p-button-icon-only p-button-rounded p-button-danger"
            @click="createContent" />
  </div>
</template>

<script setup>
  import Button from 'primevue/button'

  const props = defineProps({
    path: {
      type: String,
      required: true
    },
    objectType: {
      type: String,
      required: true
    },
    editorRoute: {
      type: Function,
      default: (objectType, object) => {
        const [service, type] = objectType.split('_')
        const prop = type[0].toLowerCase()+type.slice(1)
        return { name: `${service}:${prop}Editor`, params: { [prop+'Id']: object }}
      }
    },
    createActionName: {
      type: String,
      default: null
    },
    createActionParams: {
      type: Object,
      default: () => {}
    }
  })

  import { toRefs } from "@vueuse/core"
  import { computed } from "vue"

  import { useHost } from "@live-change/frontend-base"
  const host = useHost()

  const { path, objectType } = toRefs(props)

  import { useToast } from 'primevue/usetoast'
  const toast = useToast()
  import { useConfirm } from 'primevue/useconfirm'
  const confirm = useConfirm()

  import { useRouter } from 'vue-router'
  const router = useRouter()

  const serviceName = computed(() => {
    const [service, type] = objectType.value.split('_')
    return service
  })
  const typeName = computed(() => {
    const [service, type] = objectType.value.split('_')
    return type
  })
  const typeNameLower = computed(() => typeName.value[0].toLowerCase()+typeName.value.slice(1))

  function createContent() {
    confirm.require({
      target: event.currentTarget,
      message: `Do you want to create ${typeNameLower.value} at ${host}/${path.value} ?`,
      icon: 'pi pi-info-circle',
      acceptClass: 'p-button-danger',
      accept: async () => {
        const contentId = await api.actions[serviceName.value][props.createActionName || `create${typeName.value}`]({
          ...props.createActionParams
        })
        await api.actions.url.takeUrl({
          target: contentId, targetType: objectType.value, path: path.value, domain: host, redirect: false
        })
        toast.add({ severity:'success', summary: `${typeName} created`, life: 1500 })
        setTimeout(() => {
          router.push(props.editorRoute(objectType.value, contentId))
        }, 200)
      },
      reject: () => {
        toast.add({ severity:'error', summary: 'Rejected', detail: 'You have rejected', life: 3000 })
      }
    })
  }

</script>

<style scoped>

</style>
