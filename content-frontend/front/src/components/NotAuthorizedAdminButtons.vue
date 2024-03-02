<template>
  <div class="absolute top-0 right-0 pr-4 max-h-0 flex align-items-center z-5">
    <router-link :to="editorRoute(objectType, object)" class="no-underline">
      <Button icon="pi pi-pencil"
              class="p-button p-button-icon-only p-button-rounded p-button-warning mr-2" />
    </router-link>
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
    object: {
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
    }
  })

  import { toRefs } from "@vueuse/core"

  const { objectType, object, editorRoute } = toRefs(props)

</script>

<style scoped>

</style>
