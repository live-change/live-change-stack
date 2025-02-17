<template>

  <LimitedAccess :requiredRoles="['writer']" :objectType="objectType" :object="object" hidden>
    <div class="absolute top-0 right-0 pr-6 max-h-0 flex items-center z-50">
      <Badge severity="warning" value="This is page preview" class="mr-2" />
      <router-link :to="editorRoute(objectType, object)" class="no-underline">
        <Button icon="pi pi-pencil"
                class="p-button p-button-icon-only p-button-rounded p-button-warning mr-2" />
      </router-link>
    </div>
    <Content :objectType="objectType" :object="object" :style="style" :class="clazz" preview />
  </LimitedAccess>

</template>

<script setup>
  import Button from "primevue/button"
  import Badge from "primevue/badge"

  import { ResolveUrl, NotFound } from "@live-change/url-frontend"
  import { LimitedAccess } from "@live-change/access-control-frontend";
  import Content from "./Content.vue"

  import { computed, watch, ref, onMounted } from 'vue'
  import { toRefs } from "@vueuse/core"
  import { useHost } from "@live-change/frontend-base"

  const isMounted = ref(false)
  onMounted(() => isMounted.value = true)

  import { path, live, useApi } from '@live-change/vue3-ssr'
  const api = useApi()
  const p = path()

  const urlMore = [
    url => p.content.page({ page: url.target })
  ]

  const props = defineProps({
    objectType: {
      type: String,
      required: true
    },
    object: {
      type: String,
      required: true
    },
    class: {
      type: String,
      default: ''
    },
    style: {
      type: String,
      default: ''
    },
    editorRoute: {
      type: Function,
      default: (objectType, object) => {
        const [service, type] = objectType.split('_')
        const prop = type[0].toLowerCase()+type.slice(1)
        return { name: `${service}:${prop}Editor`, params: { [prop+'Id']: object }}
      }
    },
  })
  const { objectType, object, class: clazz, style } = toRefs(props)

</script>

<style scoped>

</style>
