<template>
  <ResolveUrl :targetType="objectType" :path="urlPath" :fetchMore="urlMore">
    <template #default="{ target, style, class: clazz }">
      <Metadata :objectType="objectType" :object="target" />
      <LimitedAccess :requiredRoles="['writer']" :objectType="objectType" :object="target" hidden>
        <ContentAdminButtons :objectType="objectType" :object="target" :style="style" :class="clazz"
                             :name="urlPath.value" :editorRoute="editorRoute" />
      </LimitedAccess>
      <Content :objectType="objectType" :object="target" class="w-full" :style="style" :class="clazz" />
    </template>
    <template #notFound="{ path, style, class: clazz }">
      <NotFoundAdminButtons v-if="canCreateContent" :path="urlPath"
                            :objectType="objectType" :editorRoute="editorRoute"
                            :style="style" :class="clazz" />
      <NotFound :style="style" :class="clazz" />
    </template>
    <template #notAuthorized="{ path, style, class: clazz, target, access }">
      <NotAuthorizedAdminButtons v-if="(access?.roles ?? []).includes('writer')"
                                 :path="urlPath" :style="style" :class="clazz" :object="target"
                                 :objectType="objectType" :editorRoute="editorRoute"/>
      <NotAuthorized :style="style" :class="clazz" />
    </template>
  </ResolveUrl>
</template>

<script setup>
  import Button from "primevue/button"
  import ContentAdminButtons from "./ContentAdminButtons.vue"
  import NotFoundAdminButtons from "./NotFoundAdminButtons.vue"
  import NotAuthorizedAdminButtons from "./NotAuthorizedAdminButtons.vue"

  import { ResolveUrl, NotFound, NotAuthorized } from "@live-change/url-frontend"
  import { LimitedAccess } from "@live-change/access-control-frontend";
  import Content from "./Content.vue"
  import Metadata from "./Metadata.vue"

  import { computed, watch, ref, onMounted } from 'vue'
  import { toRefs } from "@vueuse/core"

  const isMounted = ref(false)
  onMounted(() => isMounted.value = true)

  import { path, live, useApi } from '@live-change/vue3-ssr'
  const api = useApi()
  const p = path()

  const props = defineProps({
    objectType: {
      type: String,
      required: true
    },
    path: {
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
    class: {},
    style: {}
  })
  const { objectType, path: urlPath, class: clazz, style } = toRefs(props)

  const urlMore = computed(() => [
    url => p.content.content({ objectType: objectType.value, object: url.target }),
    url => p.content.metadata({ objectType: objectType.value, object: url.target }),
    url => p.url.canonical({ targetType: objectType.value, target: url.target })
  ])

  const canCreateContent = computed(() => api.client.value.roles.includes('writer'))

</script>

<style scoped>

</style>
