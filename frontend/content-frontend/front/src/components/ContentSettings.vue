<template>
  <Accordion :multiple="true" class="w-full mb-2">
    <AccordionTab>
      <template #header>
        <UrlsInfo :targetType="objectType" :target="object" class="w-full" />
      </template>
      <Urls :key="key" :targetType="objectType" :target="object" />
    </AccordionTab>
    <AccordionTab>
      <template #header>
        <span class="font-bold mr-1">Public access: {{ publicAccessLevel }}</span>
      </template>
      <AccessControl :objectType="objectType" :object="object" />
    </AccordionTab>
    <AccordionTab>
      <template #header>
        <span v-if="metadata" class="font-bold mr-1">Metadata:</span>
        <span v-if="metadata" class="mr-1 font-normal">{{ metadata.title }}</span>
        <span v-else class="font-bold text-red-600">Metadata not set</span>
      </template>
      <MetadataEditor :objectType="objectType" :object="object" :key="key"></MetadataEditor>
    </AccordionTab>
  </Accordion>
</template>

<script setup>

  import Accordion from 'primevue/accordion'
  import AccordionTab from 'primevue/accordiontab'
  import Button from 'primevue/button'

  import { UrlsInfo, Urls, NotFound } from '@live-change/url-frontend'
  import { AccessControl } from '@live-change/access-control-frontend'
  import MetadataEditor from "./MetadataEditor.vue"

  const props = defineProps({
    objectType: {
      type: String,
      required: true
    },
    object: {
      type: String,
      required: true
    }
  })

  import { toRefs } from "@vueuse/core"
  import { computed } from 'vue'

  const { objectType, object } = toRefs(props)

  const key = computed(() => `${objectType.value}:${object.value}`)

  import { useApi, path, live } from '@live-change/vue3-ssr'
  const api = useApi()
  const p = path()

  const livePublicAccessPath = computed(
    () =>  p.accessControl.publicAccess({ objectType: objectType.value, object: object.value })
  )
  const liveMetadataPath = computed(
    () =>  p.content.metadata({ objectType: objectType.value, object: object.value })
  )

  const [publicAccessData, metadata] = await Promise.all([
    live(livePublicAccessPath),
    live(liveMetadataPath)
  ]).catch(e => [null, null, null, null])

  const publicAccessLevel = computed(() => {
    if(publicAccessData?.sessionRoles?.includes('reader')) return 'session'
    if(publicAccessData?.userRoles?.includes('reader')) return 'user'
    return 'none'
  })

</script>

<style scoped>

</style>
